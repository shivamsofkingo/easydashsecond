const { logger } = require("../config/loggerConfig.js");
const constants = require("../constants/constants");

const roleIdentity = (...roles) => {
  return (req, res, next) => {
    try {
      if (!roles.includes(req.user.role)) {
        return res.status(constants.httpStatus.forbidden).json({
          msg: "access denied",
        });
      }
      next();
    } catch (error) {
      logger.error(`error in role identity: ${error.message}`, {error});
      next(error);
    }
  };
};

module.exports = roleIdentity;