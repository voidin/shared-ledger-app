const UserModel = require('../models/user.js');
const { success, error } = require('../utils/response.js');

async function getProfile(req, res) {
  try {
    const userId = req.user.userId;

    const user = await UserModel.findById(userId);

    if (!user) {
      return error(res, '用户不存在', 404);
    }

    return success(res, {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      avatar: user.avatar,
      created_at: user.created_at,
      updated_at: user.updated_at
    }, '获取成功');
  } catch (err) {
    console.error('Get profile error:', err);
    return error(res, '获取用户信息失败', 500);
  }
}

async function updateProfile(req, res) {
  try {
    const userId = req.user.userId;
    const { nickname, avatar } = req.body;

    if (nickname !== undefined && typeof nickname !== 'string') {
      return error(res, '昵称格式不正确', 400);
    }

    if (nickname && nickname.length > 50) {
      return error(res, '昵称不能超过50个字符', 400);
    }

    if (avatar !== undefined && typeof avatar !== 'string') {
      return error(res, '头像URL格式不正确', 400);
    }

    const updateData = {};
    if (nickname !== undefined) {
      updateData.nickname = nickname.trim();
    }
    if (avatar !== undefined) {
      updateData.avatar = avatar.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return error(res, '没有需要更新的字段', 400);
    }

    const updatedUser = await UserModel.update(userId, updateData);

    if (!updatedUser) {
      return error(res, '用户不存在或更新失败', 404);
    }

    return success(res, {
      id: updatedUser.id,
      phone: updatedUser.phone,
      nickname: updatedUser.nickname,
      avatar: updatedUser.avatar,
      created_at: updatedUser.created_at,
      updated_at: updatedUser.updated_at
    }, '更新成功');
  } catch (err) {
    console.error('Update profile error:', err);
    return error(res, '更新用户信息失败', 500);
  }
}

module.exports = {
  getProfile,
  updateProfile
};
