// src/config/database.ts
export interface DatabaseConfig {
    database: string;
    username: string;
    password: string;
    host: string;
    port: number;
    dialect: 'postgres' | 'mysql' | 'sqlite' | 'mariadb';
    use_env_variable?: string;
}

const config: Record<string, DatabaseConfig> = {
    development: {
        database: process.env.DB_NAME || 'lumen_dev',
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASS || 'lumen123',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        dialect: 'postgres', // 改成你用的数据库
    },
};

export default config;

