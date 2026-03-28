const Joi = require('joi');

exports.createJobSchema = Joi.object({
    customerId: Joi.string().required(),
    serviceType: Joi.string().required(),
    location: Joi.object({
        lat: Joi.number().required(),
        lng: Joi.number().required(),
        address: Joi.string().allow('', null)
    }).required(),
    price: Joi.number().required(),
    description: Joi.string().allow('', null)
});

exports.statusUpdateSchema = Joi.object({
    status: Joi.string().valid(
        'OFFERED', 'ACCEPTED', 'ON_THE_WAY', 
        'IN_PROGRESS', 'COMPLETED', 'PAID', 'CANCELLED'
    ).required(),
    otp: Joi.string().when('status', {
        is: 'IN_PROGRESS',
        then: Joi.required(),
        otherwise: Joi.optional()
    })
});
