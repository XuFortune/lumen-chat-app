// packages/api-core/src/models/UserMemory.ts
import {
    Model,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
} from 'sequelize';

class UserMemory extends Model<
    InferAttributes<UserMemory>,
    InferCreationAttributes<UserMemory>
> {
    declare id: CreationOptional<string>;
    declare user_id: string; // 绑定到用户
    declare content: string; // 长期记忆 (用户画像、偏好)
    declare last_consolidated_at: CreationOptional<Date>;
    declare created_at: CreationOptional<Date>;
    declare updated_at: CreationOptional<Date>;
}

export function initUserMemory(sequelize: any) {
    UserMemory.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4,
            },
            user_id: {
                type: DataTypes.UUID,
                allowNull: false,
                unique: true, // 每个用户只能有一份主记忆 (MVP设计)
                references: {
                    model: 'Users',
                    key: 'id',
                },
            },
            content: {
                type: DataTypes.TEXT,
                allowNull: true,
                defaultValue: '',
            },
            last_consolidated_at: {
                type: DataTypes.DATE,
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
            modelName: 'UserMemory',
            tableName: 'UserMemories',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        }
    );
    return UserMemory;
}
