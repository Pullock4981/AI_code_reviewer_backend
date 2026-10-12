// No authentication required in this system
const auth = (req, res, next) => {
  next();
};

module.exports = auth;
