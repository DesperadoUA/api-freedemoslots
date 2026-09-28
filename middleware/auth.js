const UsersModel = require("./../models/UsersKnex");
async function checkAuth(req, res, next) {
  const response = { confirm: "error" };
  const { id, session } = req.body;
  const candidate = await UsersModel.checkSession(id, session);
  if (candidate.data && candidate.confirm === "ok") next();
  else res.status(200).json(response);
}
module.exports = checkAuth;
