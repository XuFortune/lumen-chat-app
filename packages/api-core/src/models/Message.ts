// packages/api-core/src/models/Message.ts
import {
    Model,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
} from 'sequelize';

class Message extends Model<
    InferAttributes<Message>,
    InferCreationAttributes<Message>
> {
    declare id: CreationOptional<string>;
    declare conversation_id: string;
    declare role: 'user' | 'assistant';
    declare content: string;
    declare metadata: CreationOptional<Record<string, any> | null>;
    declare created_at: CreationOptional<Date>;
}

export function initMessage(sequelize: any) {
    Message.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4,
            },
            conversation_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'Conversations',
                    key: 'id',
                },
            },
            role: {
                type: DataTypes.STRING(16),
                allowNull: false,
                validate: {
                    isIn: [['user', 'assistant']],
                },
            },
            content: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            metadata: {
                type: DataTypes.JSONB,
                allowNull: true,
            },
            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW
            },
        },
        {
            sequelize,
            modelName: 'Message',
            tableName: 'Messages',
            timestamps: false, // 因为我们只定义了 created_at
        }
    );
    return Message;
}
