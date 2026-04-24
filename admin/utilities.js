const User = require("../models/users.js");
const Admin = require("../models/admin.js");
const Giveaway = require("../models/giveaways.js");
const Marketplace = require("../models/marketplace.js");
const Accommodation = require("../models/accomodation.js");
const Event = require("../models/event.js");
const Community = require("../models/community.js");

const hasPermission = async (userId, role) => {
  try {
    const user = await Admin.findById(userId);
    if (!user) {
      return false;
    }
    if (user.role.includes(role)) {
      return true;
    }
    return false;
  } catch (error) {
    console.log("error in hasPermission", error.message);
    return false;
  }
};

const getAllGiveawaysPost = async (param) => {
  try {
    const pageSize = param.perPage;
    const page = param.page;
    const totalCount = await Giveaway.countDocuments({
      isSold: false,
      isDeleted: false
    });
    const totalPages = Math.ceil(totalCount / pageSize);
    if (page > totalPages) {
      return { giveaways: [], totalPages };
    }
    const skip = (page - 1) * pageSize;
    const giveaways = await Giveaway.find({ isSold: false, isDeleted: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .exec();

    return { giveaways, totalPages, totalCount };
  } catch (error) {
    console.log("error in getAllGiveawayPost", error.message);
    return false;
  }
};

const getAllMarketPlacePost = async (param) => {
  try {
    const pageSize = param.perPage;
    const page = param.page;
    const totalCount = await Marketplace.countDocuments({
      isSold: false,
      isDeleted: false
    });
    const totalPages = Math.ceil(totalCount / pageSize);
    if (page > totalPages) {
      return { marketplaces: [], totalPages };
    }
    const skip = (page - 1) * pageSize;
    const marketplaces = await Marketplace.find({ isSold: false, isDeleted: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .exec();

    return { marketplaces, totalPages, totalCount };
  } catch (error) {
    console.log("error in getAllMarketplacePost", error.message);
    return false;
  }
};

const getAllAccomodationPost = async (param) => {
  try {
    const pageSize = param.perPage;
    const page = param.page;
    const region = param.region;
    
    const filter = {
      isSold: false,
      isDeleted: false,
      ...(region && { region })
    };

    const totalCount = await Accommodation.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / pageSize);
    if (page > totalPages && totalPages !== 0) {
      return { accomodations: [], totalPages };
    }
    const skip = (page - 1) * pageSize;
    const accomodations = await Accommodation.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .exec();

    return { accomodations, totalPages, totalCount };
  } catch (error) {
    console.log("error in getAllAccomodationPost", error.message);
    return false;
  }
};

const getAllEventPost = async (param) => {
  try {
    const pageSize = param.perPage;
    const page = param.page;
    const totalCount = await Event.countDocuments({
      isEventCompleted: false,
      isDeleted: false
    });
    const totalPages = Math.ceil(totalCount / pageSize);
    if (page > totalPages) {
      return { events: [], totalPages };
    }
    const skip = (page - 1) * pageSize;
    const events = await Event.find({ isEventCompleted: false, isDeleted: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .exec();

    return { events, totalPages, totalCount };
  } catch (error) {
    console.log("error in getAllEventPost", error.message);
    return false;
  }
};

const getDeletedGiveaways = async (param) => {
  const { perPage, page } = param;
  try {
    const totalCount = await Giveaway.countDocuments({ isDeleted: true });
    const totalPages = Math.ceil(totalCount / perPage);
    if (page > totalPages) {
      return { giveaways: [], totalPages, totalCount: 0 };
    }
    const skip = (page - 1) * perPage;
    const giveaways = await Giveaway.find({ isDeleted: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(perPage)
      .exec();
    return { giveaways, totalPages, totalCount };
  } catch (error) {
    console.log("error in getGiveawayAds", error.message);
    return false;
  }
};

const getDeletedMarketplace = async (param) => {
  const { perPage, page } = param;
  try {
    const totalCount = await Marketplace.countDocuments({ isDeleted: true });
    const totalPages = Math.ceil(totalCount / perPage);
    if (page > totalPages) {
      return { marketplaces: [], totalPages, totalCount: 0 };
    }
    const skip = (page - 1) * perPage;
    const marketplaces = await Marketplace.find({ isDeleted: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(perPage)
      .exec();
    return { marketplaces, totalPages, totalCount };
  } catch (error) {
    console.log("error in getDeletedMarketplace", error.message);
    return false;
  }
};

const getDeletedAccommodation = async (param) => {
  const { perPage, page } = param;
  try {
    const totalCount = await Accommodation.countDocuments({ isDeleted: true });
    const totalPages = Math.ceil(totalCount/perPage);
    if(page > totalPages) {
      return { accommodations: [], totalPages, totalCount: 0 }
    }
    const skip = (page - 1) * perPage;
    const accommodations = await Accommodation.find({ isDeleted: true }).sort({ createdAt: -1}).skip(skip).limit(perPage).exec();
    return { accommodations, totalPages, totalCount };
  } catch (error) {
    console.log("error in getDeletedAccommodation", error.message);
    return false;
  }
}

const getDeletedEvents = async (param)=> {
  const { perPage, page } = param;
  try {
    const totalCount = await Event.countDocuments({ isDeleted: true });
    const totalPages = Math.ceil(totalCount/perPage);
    if(page > totalPages) {
      return { events: [], totalPages, totalCount: 0 }
    }
    const skip = (page - 1) * perPage;
    const events = await Event.find({ isDeleted: true }).sort({ createdAt: -1}).skip(skip).limit(perPage).exec();
    return { events, totalPages, totalCount };
  } catch (error) {
    console.log("error in getDeletedEvents", error.message);
    return false;
  }
}

const isValidObjectId = (id) => {
  const mongoose = require("mongoose");
  return mongoose.Types.ObjectId.isValid(id);
};

module.exports = {
  hasPermission,
  getAllGiveawaysPost,
  getAllMarketPlacePost,
  getAllAccomodationPost,
  getAllEventPost,
  getDeletedGiveaways,
  getDeletedMarketplace,
  getDeletedAccommodation,
  getDeletedEvents,
  isValidObjectId,
};
