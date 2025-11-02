// src/models/index.ts
import { Sequelize } from 'sequelize';
import config from '../config/database';

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// 创建数据库连接（和你原来的 index.js 逻辑一致）
const sequelize = dbConfig.use_env_variable
    ? new Sequelize(process.env[dbConfig.use_env_variable]!, dbConfig)
    : new Sequelize(
        dbConfig.database,
        dbConfig.username,
        dbConfig.password,
        dbConfig
    );

// 手动初始化模型（TS 中必须显式 import）
import { initUser } from './User';
const User = initUser(sequelize);

// 如果有其他模型，继续 import...
// import { initPost } from './Post';
// const Post = initPost(sequelize);

// 设置关联（示例）
// User.hasMany(Post);

// 统一导出
export { User };
export default { User, sequelize, Sequelize };
