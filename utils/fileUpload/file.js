const {
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  S3Client,
  HeadObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
require("dotenv").config();

const client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const getProfileImageUrl = async (fileName, myUserId) => {
  try {
    const command = new GetObjectCommand({
      Bucket: `users/${myUserId}/profileImage/${fileName}`,
    });
    const signedUrl = await getSignedUrl(client, command);
    return signedUrl;
  } catch (error) {
    throw new Error(error.message);
  }
};

const createProfileUploadUrl = async (fileName, contentType, myUserId) => {
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET,
      Key: `users/${myUserId}/profileImage/${fileName}`,
      ContentType: contentType,
    });
    const url = await getSignedUrl(client, command);
    return url;
  } catch (error) {
    console.log("Error in createProfileUploadUrl", error.message);
    throw new Error(error.message);
  }
};

const createProfileUploadUrlAdmin = async (fileName, contentType, myUserId) => {
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET,
      Key: `admins/${myUserId}/profileImage/${fileName}`,
      ContentType: contentType,
    });
    const url = await getSignedUrl(client, command);
    return url;
  } catch (error) {
    console.log("Error in createProfileUploadUrlAdmin", error.message);
    throw new Error(error.message);
  }
};

const createCoverImageUploadUrl = async (fileName, contentType, myUserId) => {
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET,
      Key: `users/${myUserId}/coverImage/${fileName}`,
      ContentType: contentType
    });
    const url = await getSignedUrl(client, command);
    return url;
  } catch (error) {
    console.log("Error in createCoverImageUploadUrl", error.message);
    throw new Error(error.message);
  }
}

const deleteProfileImages = async (fileNames, myUserId) => {
  try {
    for (let fileName of fileNames) {
      const extractedFileName = fileName.split("/").pop();
      const cleanedFileName = extractedFileName.replace(/\.(\w+)(\.\1)+$/, ".$1");
      const extension = cleanedFileName.split('.').pop().toLowerCase();
      const validExtensions = ["jpg", "jpeg", "png", "webp"];
      if (!validExtensions.includes(extension)) {
        console.log(`Invalid file extension for: ${cleanedFileName}`);
        continue;
      }
      const key = `users/${myUserId}/profileImage/${cleanedFileName}`;
      const headCommand = new HeadObjectCommand({
        Bucket: process.env.BUCKET,
        Key: key,
      });
      try {
        await client.send(headCommand);
      } catch (error) {
        if (error.name === "NotFound") {
          console.log(`Profile image not found: ${key}`);
          continue;
        }
        throw error;
      }
      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.BUCKET,
        Key: key,
      });
      const response = await client.send(deleteCommand);
      if (response.$metadata.httpStatusCode !== 204) {
        console.log(`Failed to delete Profile image: ${cleanedFileName}`);
      } else {
        console.log(
          `Successfully deleted Profile image: ${cleanedFileName}`
        );
      }
    }
  } catch (error) {
    console.log("Error in deleteProfileImage:", error.message);
    throw new Error(error.message);
  }
};

const createGiveawayUploadUrl = async (fileName, contentType, myUserId) => {
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET,
      Key: `users/${myUserId}/giveaways/${fileName}`,
      ContentType: contentType,
    });
    const url = await getSignedUrl(client, command);
    return url;
  } catch (error) {
    console.log("Error in createGiveawayUploadUrl", error.message);
    throw new Error(error.message);
  }
};

const deleteGiveawayImages = async (fileNames, myUserId) => {
  try {
    for (let fileName of fileNames) {
      const extractedFileName = fileName.split("/").pop();
      const cleanedFileName = extractedFileName.replace(/\.(\w+)(\.\1)+$/, ".$1");
      const extension = cleanedFileName.split('.').pop().toLowerCase();
      const validExtensions = ["jpg", "jpeg", "png", "webp"];
      if (!validExtensions.includes(extension)) {
        console.log(`Invalid file extension for: ${cleanedFileName}`);
        continue;
      }
      const key = `users/${myUserId}/giveaways/${cleanedFileName}`;
      const headCommand = new HeadObjectCommand({
        Bucket: process.env.BUCKET,
        Key: key,
      });
      try {
        await client.send(headCommand);
      } catch (error) {
        if (error.name === "NotFound") {
          console.log(`Giveaway image not found: ${key}`);
          continue;
        }
        throw error;
      }
      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.BUCKET,
        Key: key,
      });
      const response = await client.send(deleteCommand);
      if (response.$metadata.httpStatusCode !== 204) {
        console.log(`Failed to delete giveaway image: ${cleanedFileName}`);
      } else {
        console.log(`Successfully deleted giveaway image: ${cleanedFileName}`);
      }
    }
  } catch (error) {
    console.log("Error in deleteGiveawaysImage:", error.message);
    throw new Error(error.message);
  }
};

const createMarketplaceUploadUrl = async (fileName, contentType, myUserId) => {
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET,
      Key: `users/${myUserId}/marketplace/${fileName}`,
      ContentType: contentType,
    });
    const url = await getSignedUrl(client, command);
    return url;
  } catch (error) {
    console.log("Error in createMarketplaceUploadUrl", error.message);
    throw new Error(error.message);
  }
};

const deleteMarketplaceImages = async (fileNames, myUserId) => {
  try {
    for (let fileName of fileNames) {
      const extractedFileName = fileName.split("/").pop();
      const cleanedFileName = extractedFileName.replace(/\.(\w+)(\.\1)+$/, ".$1");
      const extension = cleanedFileName.split('.').pop().toLowerCase();
      const validExtensions = ["jpg", "jpeg", "png", "webp"];
      if (!validExtensions.includes(extension)) {
        console.log(`Invalid file extension for: ${cleanedFileName}`);
        continue;
      }
      const key = `users/${myUserId}/marketplace/${cleanedFileName}`;
      const headCommand = new HeadObjectCommand({
        Bucket: process.env.BUCKET,
        Key: key,
      });
      try {
        await client.send(headCommand);
      } catch (error) {
        if (error.name === "NotFound") {
          console.log(`Marketplace image not found: ${key}`);
          continue;
        }
        throw error;
      }
      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.BUCKET,
        Key: key,
      });
      const response = await client.send(deleteCommand);
      if (response.$metadata.httpStatusCode !== 204) {
        console.log(`Failed to delete Marketplace image: ${cleanedFileName}`);
      } else {
        console.log(
          `Successfully deleted Marketplace image: ${cleanedFileName}`
        );
      }
    }
  } catch (error) {
    console.log("Error in deleteAccomodationImage:", error.message);
    throw new Error(error.message);
  }
};

const createAccomodationUploadUrl = async (fileName, contentType, myUserId) => {
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET,
      Key: `users/${myUserId}/accomodations/${fileName}`,
      ContentType: contentType,
    });
    const url = await getSignedUrl(client, command);
    return url;
  } catch (error) {
    console.log("Error in createAccomodationUploadUrl", error.message);
    throw new Error(error.message);
  }
};

const deleteAccomodationImages = async (fileNames, myUserId) => {
  try {
    for (let fileName of fileNames) {
      const extractedFileName = fileName.split("/").pop();
      const cleanedFileName = extractedFileName.replace(/\.(\w+)(\.\1)+$/, ".$1");
      const extension = cleanedFileName.split('.').pop().toLowerCase();
      const validExtensions = ["jpg", "jpeg", "png", "webp"];
      if (!validExtensions.includes(extension)) {
        console.log(`Invalid file extension for: ${cleanedFileName}`);
        continue;
      }
      const key = `users/${myUserId}/accomodations/${cleanedFileName}`;
      const headCommand = new HeadObjectCommand({
        Bucket: process.env.BUCKET,
        Key: key,
      });
      try {
        await client.send(headCommand);
      } catch (error) {
        if (error.name === "NotFound") {
          console.log(`Accomodation image not found: ${key}`);
          continue;
        }
        throw error;
      }
      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.BUCKET,
        Key: key,
      });
      const response = await client.send(deleteCommand);
      if (response.$metadata.httpStatusCode !== 204) {
        console.log(`Failed to delete Accomodation image: ${cleanedFileName}`);
      } else {
        console.log(
          `Successfully deleted Accomodation image: ${cleanedFileName}`
        );
      }
    }
  } catch (error) {
    console.log("Error in deleteAccomodationImage:", error.message);
    throw new Error(error.message);
  }
};

const createEventUploadUrl = async (fileName, contentType, myUserId) => {
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET,
      Key: `users/${myUserId}/events/${fileName}`,
      ContentType: contentType,
    });
    const url = await getSignedUrl(client, command);
    return url;
  } catch (error) {
    console.log("Error in createEventUploadUrl", error.message);
    throw new Error(error.message);
  }
};

const deleteEventImages = async (fileNames, myUserId) => {
  try {
    for (let fileName of fileNames) {
      const extractedFileName = fileName.split("/").pop();
      const cleanedFileName = extractedFileName.replace(/\.(\w+)(\.\1)+$/, ".$1");
      const extension = cleanedFileName.split('.').pop().toLowerCase();
      const validExtensions = ["jpg", "jpeg", "png", "webp"];
      if (!validExtensions.includes(extension)) {
        console.log(`Invalid file extension for: ${cleanedFileName}`);
        continue;
      }
      const key = `users/${myUserId}/events/${cleanedFileName}`;
      const headCommand = new HeadObjectCommand({
        Bucket: process.env.BUCKET,
        Key: key,
      });
      try {
        await client.send(headCommand);
      } catch (error) {
        if (error.name === "NotFound") {
          console.log(`Events image not found: ${key}`);
          continue;
        }
        throw error;
      }
      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.BUCKET,
        Key: key,
      });
      const response = await client.send(deleteCommand);
      if (response.$metadata.httpStatusCode !== 204) {
        console.log(`Failed to delete Event image: ${cleanedFileName}`);
      } else {
        console.log(`Successfully deleted Event image: ${cleanedFileName}`);
      }
    }
  } catch (error) {
    console.log("Error in deleteEventImage:", error.message);
    throw new Error(error.message);
  }
};

const createCommunityUploadUrl = async (fileName, contentType, myUserId) => {
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET,
      Key: `users/${myUserId}/community/${fileName}`,
      ContentType: contentType,
    });
    const url = await getSignedUrl(client, command);
    return url;
  } catch (error) {
    console.log("Error in createCommunityUploadUrl", error.message);
    throw new Error(error.message);
  }
};

const deleteCommunityImages = async (fileNames, myUserId) => {
  try {
    for (let fileName of fileNames) {
      const extractedFileName = fileName.split("/").pop();
      const cleanedFileName = extractedFileName.replace(/\.(\w+)(\.\1)+$/, ".$1");
      const extension = cleanedFileName.split('.').pop().toLowerCase();
      const validExtensions = ["jpg", "jpeg", "png", "webp"];
      if (!validExtensions.includes(extension)) {
        console.log(`Invalid file extension for: ${cleanedFileName}`);
        continue;
      }
      const key = `users/${myUserId}/community/${cleanedFileName}`;
      const headCommand = new HeadObjectCommand({
        Bucket: process.env.BUCKET,
        Key: key,
      });
      try {
        await client.send(headCommand);
      } catch (error) {
        if (error.name === "NotFound") {
          console.log(`Community image not found: ${key}`);
          continue;
        }
        throw error;
      }
      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.BUCKET,
        Key: key,
      });
      const response = await client.send(deleteCommand);
      if (response.$metadata.httpStatusCode !== 204) {
        console.log(`Failed to delete community image: ${cleanedFileName}`);
      } else {
        console.log(`Successfully deleted Group image: ${cleanedFileName}`);
      }
    }
  } catch (error) {
    console.log("Error in deleteCommunityImage:", error.message);
    throw new Error(error.message);
  }
};

const createGroupUploadUrl = async (fileName, contentType, groupId) => {
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET,
      Key: `groups/${groupId}/${fileName}`,
      ContentType: contentType,
    });
    const url = await getSignedUrl(client, command);
    return url;
  } catch (error) {
    console.log("Error in createGroupUploadUrl", error.message);
    throw new Error(error.message);
  }
};

const deleteGroupImages = async (fileNames, myUserId) => {
  try {
    for (let fileName of fileNames) {
      const extractedFileName = fileName.split("/").pop();
      const cleanedFileName = extractedFileName.replace(/\.(\w+)(\.\1)+$/, ".$1");
      const extension = cleanedFileName.split('.').pop().toLowerCase();
      const validExtensions = ["jpg", "jpeg", "png", "webp"];
      if (!validExtensions.includes(extension)) {
        console.log(`Invalid file extension for: ${cleanedFileName}`);
        continue;
      }
      const key = `users/${myUserId}/groups/${cleanedFileName}`;
      const headCommand = new HeadObjectCommand({
        Bucket: process.env.BUCKET,
        Key: key,
      });
      try {
        await client.send(headCommand);
      } catch (error) {
        if (error.name === "NotFound") {
          console.log(`Group image not found: ${key}`);
          continue;
        }
        throw error;
      }
      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.BUCKET,
        Key: key,
      });
      const response = await client.send(deleteCommand);
      if (response.$metadata.httpStatusCode !== 204) {
        console.log(`Failed to delete Group image: ${cleanedFileName}`);
      } else {
        console.log(`Successfully deleted Group image: ${cleanedFileName}`);
      }
    }
  } catch (error) {
    console.log("Error in deleteGroupImage:", error.message);
    throw new Error(error.message);
  }
};

const createReportProblemUploadUrl = async (fileName, contentType, myUserId) => {
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET,
      Key: `users/${myUserId}/reportProblem/${fileName}`,
      ContentType: contentType,
    });
    const url = await getSignedUrl(client, command);
    return url;
  } catch (error) {
    console.log("Error in createReportProblemUploadUrl", error.message);
    throw new Error(error.message);
  }
};

const createBannerUploadUrl = async (fileName, contentType, myUserId) => {
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET,
      Key: `banners/${myUserId}/${fileName}`,
      ContentType: contentType,
    });
    const url = await getSignedUrl(client, command);
    return url;
  } catch (error) {
    console.log("Error in createBannerUploadUrl", error.message);
    throw new Error(error.message);
  }
};

const deleteBannerImages = async (fileNames, myUserId) => {
  try {
    for (let fileName of fileNames) {
      const extractedFileName = fileName.split("/").pop();
      const cleanedFileName = extractedFileName.replace(/\.(\w+)(\.\1)+$/, ".$1");
      const extension = cleanedFileName.split('.').pop().toLowerCase();
      const validExtensions = ["jpg", "jpeg", "png", "webp"];
      if (!validExtensions.includes(extension)) {
        console.log(`Invalid file extension for: ${cleanedFileName}`);
        continue;
      }
      const key = `banners/${myUserId}/${cleanedFileName}`;
      const headCommand = new HeadObjectCommand({
        Bucket: process.env.BUCKET,
        Key: key,
      });
      try {
        await client.send(headCommand);
      } catch (error) {
        if (error.name === "NotFound") {
          console.log(`Banner image not found: ${key}`);
          continue;
        }
        throw error;
      }
      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.BUCKET,
        Key: key,
      });
      const response = await client.send(deleteCommand);
      if (response.$metadata.httpStatusCode !== 204) {
        console.log(`Failed to delete banner image: ${cleanedFileName}`);
      } else {
        console.log(`Successfully deleted banner image: ${cleanedFileName}`);
      }
    }
  } catch (error) {
    console.log("Error in deleteBannerImage:", error.message);
    throw new Error(error.message);
  }
};

const createKycUploadUrl = async (fileName, contentType, myUserId) => {
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET,
      Key: `users/${myUserId}/kyc/${fileName}`,
      ContentType: contentType,
    });
    const url = await getSignedUrl(client, command);
    return url;
  } catch (error) {
    console.log("Error in createKycUploadUrl", error.message);
    throw new Error(error.message);
  }
};

const deleteKycImages = async (fileNames, myUserId) => {
  try {
    for (let fileName of fileNames) {
      const extractedFileName = fileName.split("/").pop();
      const cleanedFileName = extractedFileName.replace(/\.(\w+)(\.\1)+$/, ".$1");
      const extension = cleanedFileName.split('.').pop().toLowerCase();
      const validExtensions = ["jpg", "jpeg", "png", "webp", "pdf"];
      if (!validExtensions.includes(extension)) {
        console.log(`Invalid file extension for: ${cleanedFileName}`);
        continue;
      }
      const key = `users/${myUserId}/kyc/${cleanedFileName}`;
      const headCommand = new HeadObjectCommand({
        Bucket: process.env.BUCKET,
        Key: key,
      });
      try {
        await client.send(headCommand);
      } catch (error) {
        if (error.name === "NotFound") {
          console.log(`KYC image not found: ${key}`);
          continue;
        }
        throw error;
      }
      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.BUCKET,
        Key: key,
      });
      const response = await client.send(deleteCommand);
      if (response.$metadata.httpStatusCode !== 204) {
        console.log(`Failed to delete KYC image: ${cleanedFileName}`);
      } else {
        console.log(`Successfully deleted KYC image: ${cleanedFileName}`);
      }
    }
  } catch (error) {
    console.log("Error in deleteKycImages:", error.message);
    throw new Error(error.message);
  }
};

module.exports = {
  createProfileUploadUrl,
  createProfileUploadUrlAdmin,
  createCoverImageUploadUrl,
  createKycUploadUrl,
  deleteKycImages,
  getProfileImageUrl,
  deleteProfileImages,
  createGiveawayUploadUrl,
  deleteGiveawayImages,
  createMarketplaceUploadUrl,
  deleteMarketplaceImages,
  createAccomodationUploadUrl,
  deleteAccomodationImages,
  createEventUploadUrl,
  deleteEventImages,
  createCommunityUploadUrl,
  deleteCommunityImages,
  createGroupUploadUrl,
  deleteGroupImages,
  createReportProblemUploadUrl,
  createBannerUploadUrl,
  deleteBannerImages
};