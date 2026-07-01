const success = (data, message = "Success") => ({
  success: true,
  message,
  data,
});

const error = (message, code = "SERVER_ERROR", details = null) => ({
  success: false,
  error: { code, message, ...(details && { details }) },
});

module.exports = { success, error };
