// src/models/User.ts
import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';

class User extends Model<
  InferAttributes<User>,
  InferCreationAttributes<User>
> {
  // UUID 主键（创建时自动生成）
  declare id: CreationOptional<string>;

  // 必填字段
  declare username: string;
  declare password: string;

  // 可为空的 JSONB 字段
  declare llm_configs: CreationOptional<Record<string, any> | null>;

  // 时间戳（注意字段名是 created_at / updated_at）
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
}

// 导出 init 函数，供 index.ts 调用
export function initUser(sequelize: any) {
  User.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      llm_configs: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'Users', // 保持和你 migration 一致
      timestamps: true,
      createdAt: 'created_at', // 自定义字段名
      updatedAt: 'updated_at',
    }
  );
  return User;
}
