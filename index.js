require('dotenv').config()
const app = require('express')();
const bodyParser = require('body-parser');
const { google } = require("googleapis");
const multer = require('multer');
const fs = require('fs')
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

const upload = multer({
    storage: multer.diskStorage({
      destination: function (req, file, callback) {
        callback(null, `${__dirname}/upload`);
      },
      filename: function (req, file, callback) {
        callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
      },
    })
  });

app.post('/u/files', upload.array("files"), async(req, res)=>{
    try {
        console.log(req.files)
        let { folderId} = req.body;
        let data = [];
        for(let idx = 0; idx<req.files.length; idx++){
            let { filename, mimetype, path}= req.files[idx];
            const response = await drive.files.create({
                requestBody: {
                  name: filename, //This can be name of your choice
                  mimeType: mimetype,
                  parents: [folderId],
                },
                media: {
                  mimeType: mimetype,
                  body: fs.createReadStream(path),
                },
                supportsAllDrives: true,
              });
            data.push(response.data)
        }
      
        res.status(200).send({message : "successfully file uploaded ", data : data});
    } catch (e) {
        res.status(400).send({message : e.message});
    }
})

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
app.listen(process.env.PORT,()=>console.log(`Server is starting at PORT ${process.env.PORT}`))