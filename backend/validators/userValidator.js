const Joi = require('joi');

exports.registerSchema = Joi.object({
    name: Joi.string().required(),
    phone: Joi.string().length(10).pattern(/^[0-9]+$/).required(),
    email: Joi.string().email().allow('', null),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('customer', 'partner').required(),
    
    // Partner specific fields (made optional for flexible validation)
    skills: Joi.array().items(Joi.string()),
    customSkill: Joi.string().allow('', null),
    aadhaar: Joi.string().allow('', null),
    aadhaarPic: Joi.string().allow('', null),
    selfie: Joi.string().allow('', null),
    experience: Joi.string().allow('', null),
    gender: Joi.string().allow('', null),
    address: Joi.string().allow('', null),
    alternatePhone: Joi.string().allow('', null),
    bio: Joi.string().allow('', null),
    location: Joi.object({
        type: Joi.string().valid('Point').default('Point'),
        coordinates: Joi.array().items(Joi.number()).length(2)
    })
});

exports.loginSchema = Joi.object({
    phone: Joi.string().required(),
    password: Joi.string().required()
});
