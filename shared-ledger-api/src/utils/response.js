const DEFAULT_SUCCESS_CODE = 200;
const DEFAULT_ERROR_CODE = 400;

function success(res, data = null, message = '操作成功', httpCode = DEFAULT_SUCCESS_CODE) {
  return res.status(httpCode).json({
    code: 0,
    data,
    message
  });
}

function error(res, message = '操作失败', httpCode = DEFAULT_ERROR_CODE) {
  return res.status(httpCode).json({
    code: httpCode,
    message
  });
}

function paginate(res, data, pagination, message = '查询成功') {
  return res.status(200).json({
    code: 0,
    message,
    data,
    pagination: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.pageSize)
    }
  });
}

function created(res, data = null, message = '创建成功') {
  return success(res, data, message, 201);
}

function noContent(res) {
  return res.status(204).end();
}

module.exports = {
  success,
  error,
  paginate,
  created,
  noContent
};
