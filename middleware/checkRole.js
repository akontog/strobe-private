function requireAuth(req, res, next) {
  return next();
}

function requireRole(allowedRoles) {
  return (req, res, next) => {
    return next();
  };
}

module.exports = {
  requireAuth,
  requireRole
};
