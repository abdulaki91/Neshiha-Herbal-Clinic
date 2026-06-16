import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import bcrypt from "bcrypt";
import { ROLES, USER_STATUS } from "../config/constants.js";

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM(...Object.values(ROLES)),
      allowNull: false,
      defaultValue: ROLES.DATA_CLERK,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(USER_STATUS)),
      defaultValue: USER_STATUS.ACTIVE,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
    },
    gender: {
      type: DataTypes.STRING,
    },
    profilePhoto: {
      type: DataTypes.STRING,
    },
    department: {
      type: DataTypes.STRING,
    },
    specialization: {
      type: DataTypes.STRING,
    },
    licenseNumber: {
      type: DataTypes.STRING,
    },
    loginAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    lockUntil: {
      type: DataTypes.DATE,
    },
    lastLogin: {
      type: DataTypes.DATE,
    },
    resetPasswordToken: {
      type: DataTypes.STRING,
    },
    resetPasswordExpire: {
      type: DataTypes.DATE,
    },
    refreshToken: {
      type: DataTypes.TEXT,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    tableName: "users",
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed("password")) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  },
);

// Instance methods
User.prototype.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

User.prototype.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

User.prototype.incrementLoginAttempts = async function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return await this.update({
      loginAttempts: 1,
      lockUntil: null,
    });
  }

  const updates = { loginAttempts: this.loginAttempts + 1 };
  const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
  const lockTime = parseInt(process.env.LOCK_TIME) || 15;

  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked()) {
    updates.lockUntil = Date.now() + lockTime * 60 * 1000;
  }

  return await this.update(updates);
};

User.prototype.resetLoginAttempts = async function () {
  return await this.update({
    loginAttempts: 0,
    lockUntil: null,
  });
};

User.prototype.toJSON = function () {
  const values = { ...this.get() };
  delete values.password;
  delete values.resetPasswordToken;
  delete values.resetPasswordExpire;
  delete values.refreshToken;
  delete values.loginAttempts;
  delete values.lockUntil;
  return values;
};

export default User;
