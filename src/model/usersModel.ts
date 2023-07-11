'use strict';
module.exports = (sequelize:any,Datatypes:any)=>{
    var users: any = sequelize.define('users',{
        user_id: {
            type: Datatypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true
        },
        email: Datatypes.STRING(100),
        password: Datatypes.STRING(200),
        token: Datatypes.TEXT(),
        created_date: Datatypes.DATE(),
        last_updated_date: Datatypes.DATE(),
    },
    {
        tableName: "users",
        timestamps: false,
        underscored: true
    });
    users.associate = (models: any) => {
        // users.hasMany(models.blogs, {
        //     foreignKey: 'id',
        //     tergetKey: 'author'
        // });
        // users.belongsTo(models.event, {
        //     foreignKey: 'user_id',
        //     tergetKey: 'user_id'
        // });
    };

    return users;
};