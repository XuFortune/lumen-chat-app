// packages/api-core/src/models/Conversation.ts
import {
    Model,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
} from 'sequelize';

class Conversation extends Model<
    InferAttributes<Conversation>,
    InferCreationAttributes<Conversation>
> {
    declare id: CreationOptional<string>;
    declare user_id: string;
    declare title: string;
    declare created_at: CreationOptional<Date>;
    declare updated_at: CreationOptional<Date>;
}

export function initConversation(sequelize: any) {
    Conversation.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4,
            },
            user_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id',
                },
            },
            title: {
                type: DataTypes.STRING(255),
                allowNull: false,
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
            modelName: 'Conversation',
            tableName: 'Conversations',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        }
    );
    return Conversation;
}
