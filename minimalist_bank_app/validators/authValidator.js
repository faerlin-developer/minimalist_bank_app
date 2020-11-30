const User = require('../models/userModel');

exports.authValidation = async (req, res, next) => {
    const schemaAttributes = Object.entries(User.schema.paths);
    for (const [field, attributes] of schemaAttributes) {
        if (attributes.isRequired && !(field in req.body)) {
            const message = `Invalid request: ${field} is missing in body.`;
            return sendError(res, 400, message);
        }
    }

    next();
};

function sendError(res, statusCode, message) {
    res.status(statusCode).json({
        status: 'fail',
        message: message,
    });
}
