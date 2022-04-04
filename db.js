const Sequelize = require('sequelize');
const { STRING } = Sequelize;
const jwt = require('jsonwebtoken');
const SECRET_KEY = 'banana';

const config = {
    logging: false
};

if (process.env.LOGGING) {
    delete config.logging;
}
const conn = new Sequelize(process.env.DATABASE_URL || 'postgres://localhost/acme_db', config);

const User = conn.define('user', {
    username: STRING,
    password: STRING
});

User.byToken = async (token) => {
    try {
        const verifyGood = jwt.verify(token, SECRET_KEY);

        const user = await User.findByPk(verifyGood.userId);

        if (user) {

            return user
        }
        const error = Error('bad credentials');
        error.status = 401;
        throw error;
    }
    catch (ex) {
        const error = Error('bad credentials');
        error.status = 401;
        throw error;
    }
};

User.authenticate = async ({ username, password }) => {
    const user = await User.findOne({
        where: {
            username,
            password
        }
    });

    if (user) {

        // return jwt.sign({
        // userId: user.id
        // });
        const token = jwt.sign({
            userId: user.id
        }, SECRET_KEY);

        return token;
        // return jwt.token(newToken, SECRET_KEY);
    }
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
};

const syncAndSeed = async () => {
    await conn.sync({ force: true });
    const credentials = [
        { username: 'lucy', password: 'lucy_pw' },
        { username: 'moe', password: 'moe_pw' },
        { username: 'larry', password: 'larry_pw' }
    ];
    const [lucy, moe, larry] = await Promise.all(
        credentials.map(credential => User.create(credential))
    );
    return {
        users: {
            lucy,
            moe,
            larry
        }
    };
};

module.exports = {
    syncAndSeed,
    models: {
        User
    }
};