const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/user')
const authConfig = require('../../config/authConfig');
const mailer = require('../modules/mailer');

const router = express.Router();

function generateToken(params = {}) {
    return jwt.sign(params, authConfig.secret, {
        expiresIn: 86400
    });
}

router.post('/register', async (request, response) => {
    try {
        const { email } = request.body;
        if (await User.findOne({ email }))
            return response.status(400).send({ error: 'User already exists' })

        const user = await User.create(request.body);
        user.password = undefined;
        return response.send(
            {
                user,
                token: generateToken({
                    id: user.id
                })
            });

    } catch (err) {
        return response.status(400).send({ error: 'Registration failed' });
    }
});

router.post('/authenticate', async (request, response) => {
    const { email, password } = request.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user)
        return response.status(400).send({ errror: 'User not found' });

    if (!await bcrypt.compare(password, user.password))
        return response.status(400).send({ error: 'Password is incorrect' });

    user.password = undefined;

    return response.send(
        {
            user,
            token: generateToken({ id: user.id })
        });
});

router.post('/forgot-password', async (request, response) => {
    const { email } = request.body;
    try {
        const user = await User.findOne({ email });
        if (!user)
            return response.status(400).send({ error: 'User not found.' });

        const token = crypto.randomBytes(20).toString('hex');
        const now = new Date();
        now.setHours(now.getHours() + 1);

        await User.findByIdAndUpdate(user.id, {
            '$set': {
                passwordResetToken: token,
                passwordResetExpires: now
            }
        });

        mailer.sendMail({
            to: email,
            from: "antonio.jr.ssouza@gmail.com",
            template: 'auth/forgotPassword',
            context: { token },
        }, (err) => {
            if (err)
                return response.status(400).send({ error: 'Cannot send forgot password mail' });

            return response.status(200).send("It's OK!");
        });
    } catch (err) {
        response.status(400).send({ error: 'Error on forgot password. Try it again later.' })
    }
})

router.put('/reset-password', async (request, response) => {
    const { email, token, password } = request.body;

    try {
        const user = await User.findOne({ email })
            .select('+passwordResetToken passwordResetExpires');

        if (!user) {
            return response.status(400).send({ error: '' });
        }

        if (token !== user.passwordResetToken) {
            return response.status(400).send({ error: 'Invalid token' });
        }

        const now = new Date()
        if (now > user.passwordResetExpires) {
            return response.status(400).send('Token expired. Please, generate a new token');
        }

        user.password = password;
        user.passwordResetExpires = null;
        user.passwordResetToken = null;
        await user.save();
        response.send("Password changed succesfully!");
    } catch (err) {
        console.log("Erro no catch => %s", err);
        response.status(400).send({ error: 'Cannot reset password, try again' });
    }
})

module.exports = app => app.use('/auth', router);