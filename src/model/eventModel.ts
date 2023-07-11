'use strict';
module.exports = (sequelize:any,Datatypes:any)=>{
    var event: any = sequelize.define('event',{
        event_id: {
            type: Datatypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true
        },
        event_name: Datatypes.STRING(100),
        event_details: Datatypes.STRING(200),
        created_by: Datatypes.INTEGER(),
        invited: Datatypes.ARRAY(Datatypes.TEXT()),
        created_date: Datatypes.DATE(),
        last_updated_date: Datatypes.DATE(),
    },
    {
        tableName: "event",
        timestamps: false,
        underscored: true
    });
    event.associate = (models: any) => {
        event.belongsTo(models.users, {
            foreignKey: 'created_by',
            tergetKey: 'user_id'
        });
    };

    return event;
};