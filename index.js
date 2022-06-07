require('dotenv').config()
const app = require('express')();
const bodyParser = require('body-parser');
const { google } = require("googleapis");
const multer = require('multer');
const stream = require('stream');

/** set object format */
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true, limit : '50mb' }));


/** Drive auth */
const oauth2Client = new google.auth.OAuth2(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        process.env.REDIRECT_URI
    );
  
oauth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

const drive = google.drive({ version: "v3",auth: oauth2Client, });

/** testing url */
app.get('/', async(req, res)=>{
    res.status(200).send({message : "Okay"})
})

/** create a folder */
app.post("/c/folder", async(req, res)=>{
    try {
        let { name, parentId } = req.body;
        const fileMetadata = {
            name: name,
            mimeType: "application/vnd.google-apps.folder",
            parents: [parentId],
          };
        const newFolder = await drive.files.create({
            resource: fileMetadata,
            fields: "id",
            supportsAllDrives: true,
        });
        res.status(200).send({message : "successfully folder created", data : newFolder.data})
    } catch (e) {
        res.status(400).send({message : e.message});
    }
})

/** genrate public url for a folder or file */
app.get('/url/:fieldId', async(req, res)=>{
    try {
        let { fieldId } = req.params;
        await drive.permissions.create(
            {
            fileId: fieldId,
            supportsAllDrives: true,
            requestBody: {
                role: "reader",
                type: "anyone",
            },
            }
        );
        const result = await drive.files.get({
            fileId: fieldId,
            supportsAllDrives: true,
            fields: "webViewLink, webContentLink",
        });  
        res.status(200).send({message : "successfully genrated public url", data : result.data});  
    } catch (e) {
        res.status(400).send({message : e.message});
    }
    

})

/** upload a file  */

const upload = multer();
const uploadFile = async (fileObject, folderId) => {
    const bufferStream = new stream.PassThrough();
    bufferStream.end(fileObject.buffer);    
    const { data } = await drive.files.create({
        media: {
            mimeType: fileObject.mimeType,
            body: bufferStream,
        },
        requestBody: {
            name: fileObject.originalname,
            parents: [folderId],
        },
        fields: 'id,name',
        supportsAllDrives: true,
    });
    console.log(`Uploaded file ${data.name} ${data.id}`);
};
  

app.post('/u/files', upload.any(), async (req, res) => {
    try {
      const { body, files  } = req;
        const { folderId } = body;
      for (let f = 0; f < files.length; f += 1) {
        await uploadFile(files[f], folderId);
      }
  
      console.log(body);
      res.status(200).send('Form Submitted');
    } catch (f) {
      res.send(f.message);
    }
  });
  
/** delete a folder or file  */
app.post('/d/field', async(req, res)=>{
    try {
        let { fieldId } = req.body;
        const response = await drive.files.delete({
            fileId: fieldId,
            supportsAllDrives: true,
        });
        res.status(200).send({message : "successfully deleted the field "});
    } catch (e) {
        res.status(400).send({message : e.message});
    }
})

/**  get folder info */
app.get('/info/:fieldId', async(req, res)=>{
    let { fieldId } = req.params;
    const result = await drive.files
    .get({ fileId: fieldId , supportsAllDrives: true,})
    .catch((err) => console.log(err.errors));
    let query = "'" + fieldId +"' in parents and mimeType contains 'image/' and trashed = false";
    drive.files.list(
        {
          q: query,
          fields: "files(id, name)",
          supportsAllDrives: true
        },
        (err, response)=>{
            if(err) console.log(err.message);
            else console.log(response.data);
        }
    )
    return res.status(200).send({message : "info", data : result});

}) 
app.listen(process.env.PORT,()=>console.log(`Server is starting at PORT ${process.env.PORT}`))