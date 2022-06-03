require("dotenv").config();
const { google } = require("googleapis");
const path = require("path");
const fs = require("fs");


const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

oauth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

const drive = google.drive({
  version: "v3",
  auth: oauth2Client,
});

/* 
filepath which needs to be uploaded
Note: Assumes example.jpg file is in root directory, 
though this can be any filePath
*/
const filePath = path.join(__dirname, "example.jpg");

let paraentFolderId = "0ANN0o7ENmrxuUk9PVA";
let childFolderId = "1BD0ulWKO43q2qPzqTDzx063GIeukgpDm";
let fileId = "1pTnLJ2Vc5e4trtAHbKg576mQqdT3D0g-";
/** create a folder  */
async function createFolder() {
  try {
    const fileMetadata = {
      name: "Praveen Gupta",
      mimeType: "application/vnd.google-apps.folder",
      parents: [paraentFolderId],
    };
    const file = await drive.files.create({
      resource: fileMetadata,
      fields: "id",
      supportsAllDrives: true,
    });
    console.log("Folder Id: " + file.data.id);
  } catch (e) {
    console.log(e.message);
  }
}


// createFolder();

/** gernrating url for folder */
async function generatePublicUrlForFolder(){
  try{
      await drive.permissions.create(
        {
          fileId: childFolderId,
          supportsAllDrives: true,
          requestBody: {
            role: "reader",
            type: "anyone",
          },
        }
      );
      const result = await drive.files.get({
        fileId: childFolderId,
        supportsAllDrives: true,
        fields: "webViewLink",
      });
      console.log(result.data);
  }
  catch(e){
    console.log(e.message);
  }
}

generatePublicUrlForFolder()

/** uploading file */
async function uploadFile() {
  try {
    const response = await drive.files.create({
      requestBody: {
        name: "example.jpg", //This can be name of your choice
        mimeType: "image/jpg",
        parents: [childFolderId],
      },
      media: {
        mimeType: "image/jpg",
        body: fs.createReadStream(filePath),
      },
      supportsAllDrives: true,
    });

    console.log(response.data);
  } catch (error) {
    console.log(error.message);
  }
}

// uploadFile();


/** generatingUrl for file */

async function generatePublicUrl() {
  try {
    await drive.permissions.create({
      fileId: fileId,
      // folder_id: "0ANN0o7ENmrxuUk9PVA",
      supportsAllDrives: true,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    /* 
    webViewLink: View the file in browser
    webContentLink: Direct download link 
    */
    const result = await drive.files.get({
      fileId: fileId,
      // folder_id: "0ANN0o7ENmrxuUk9PVA",
      supportsAllDrives: true,
      fields: "webViewLink, webContentLink",
    });
    console.log(result.data);
  } catch (error) {
    console.log(error.message);
  }
}
// generatePublicUrl();

/** deleting file  */
async function deleteFile() {
  try {
    const response = await drive.files.delete({
      fileId: fileId,
      // folder_id: "0ANN0o7ENmrxuUk9PVA",
      supportsAllDrives: true,
    });
    console.log(response.data, response.status);
  } catch (error) {
    console.log(error.message);
  }
}
// deleteFile();
