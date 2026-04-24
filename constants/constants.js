const constants = {
  role: {
    superAdmin: "superAdmin",
    admin: "admin",
    groupAdmin: "groupAdmin",
    user: "user"
  },
  followStatus: {
    follow: "follow",
    unfollow: "unfollow",
    friend: "friend",
    unfriend: "unfriend",
  },
  perPage: {
    pageLimit1 : 1,
    pageLimit2 : 2,
    pageLimit3 : 3,
    pageLimit4 : 4,
    pageLimit5 : 5,
    pageLimit6 : 6,
    pageLimit7 : 7,
    pageLimit8 : 8,
    pageLimit9 : 9,
    pageLimit10 : 10,
    pageLimit11 : 11,
    pageLimit12 : 12,
    pageLimit13 : 13,
    pageLimit14 : 14,
    pageLimit15 : 15,
    pageLimit16 : 16,
    pageLimit17 : 17,
    pageLimit18 : 18,
    pageLimit19 : 19,
    pageLimit20 : 20,
    pageLimit30 : 30,
    pageLimit50 : 50,
  },
  location: {
    reach: 200,
    radian: 6378.1,
  },
  adsType: {
    giveaway: "Giveaway",
    marketplace: "Marketplace",
    accommodation: "Accommodation",
    event: "Event"
  },
  notificationType: {
    ads: "Ads",
    user: "User",
  },
  notificationMessage: {
    ads: "Your event post is availabe online!",
  },
  httpStatus: {
    ok: 200,
    badRequest: 400,
    notFound: 404,
    serverError: 500,
    validationError: 422,
    unauthorize: 401,
    forbidden: 403,
    conflict: 409,
  },
  schedule: {
    at0: 0,
    at1: 1,
    at2: 2,
    minute: 1,
    at0After15: 15,
    at0After20: 20,
    at0After30: 30,
    at1After15: 15,
    at1After20: 20,
    at1After30: 30,
    at2After15: 15,
  },
  batchSize: {
    default: 1000,
    normal: 3000,
    maxSize: 5000
  }
};

module.exports = constants;