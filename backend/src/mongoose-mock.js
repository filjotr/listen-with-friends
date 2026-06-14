const bcrypt = require('bcryptjs');

// In-memory collection data
const db = {
  users: [],
  rooms: [],
  messages: [],
  roomactivities: []
};

const generateId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
const clone = (val) => {
  if (val === null || val === undefined) return val;
  return JSON.parse(JSON.stringify(val));
};

function Schema(definition) {
  this.definition = definition;
  this.methods = {};
  this.statics = {};
  this.pres = {};
}
Schema.prototype.pre = function(hook, fn) {
  this.pres[hook] = fn;
};
Schema.Types = {
  ObjectId: String
};

const models = {};

function populateValue(val, path) {
  if (!val) return val;
  const paths = path.split(' ');
  for (const p of paths) {
    if (p === 'host') {
      if (Array.isArray(val)) {
        val.forEach(item => populateItemHost(item));
      } else {
        populateItemHost(val);
      }
    } else if (p === 'members.user' || p === 'members') {
      if (Array.isArray(val)) {
        val.forEach(item => populateItemMembers(item));
      } else {
        populateItemMembers(val);
      }
    } else if (p === 'sender') {
      if (Array.isArray(val)) {
        val.forEach(item => populateItemSender(item));
      } else {
        populateItemSender(val);
      }
    }
  }
}

function populateItemSender(item) {
  if (item && item.sender) {
    const senderId = item.sender.toString();
    const user = db.users.find(u => u._id.toString() === senderId);
    if (user) {
      item.sender = {
        _id: user._id,
        id: user._id,
        username: user.username,
        avatar: user.avatar
      };
    }
  }
}

function populateItemHost(item) {
  if (item && item.host) {
    const hostId = item.host.toString();
    const user = db.users.find(u => u._id.toString() === hostId);
    if (user) {
      item.host = {
        _id: user._id,
        id: user._id,
        username: user.username,
        avatar: user.avatar
      };
    }
  }
}

function populateItemMembers(item) {
  if (item && item.members) {
    item.members.forEach(m => {
      if (m.user) {
        const userId = m.user.toString();
        const user = db.users.find(u => u._id.toString() === userId);
        if (user) {
          m.user = {
            _id: user._id,
            id: user._id,
            username: user.username,
            avatar: user.avatar
          };
        }
      }
    });
  }
}

function createQueryChain(value) {
  const chain = {
    populate: function(path, fields) {
      populateValue(value, path);
      return chain;
    },
    sort: function(sortObj) {
      if (Array.isArray(value)) {
        const keys = Object.keys(sortObj);
        if (keys.length > 0) {
          const key = keys[0];
          const dir = sortObj[key];
          value.sort((a, b) => {
            if (a[key] < b[key]) return -1 * dir;
            if (a[key] > b[key]) return 1 * dir;
            return 0;
          });
        }
      }
      return chain;
    },
    limit: function(lim) {
      if (Array.isArray(value)) {
        value = value.slice(0, lim);
      }
      return chain;
    },
    select: function(fields) {
      if (fields === '-password') {
        if (Array.isArray(value)) {
          value.forEach(item => { delete item.password; });
        } else if (value) {
          delete value.password;
        }
      }
      return chain;
    },
    then: function(onResolve, onReject) {
      return Promise.resolve(value).then(onResolve, onReject);
    },
    catch: function(onReject) {
      return Promise.resolve(value).catch(onReject);
    }
  };
  return chain;
}

function model(modelName, schema) {
  if (models[modelName]) return models[modelName];

  function Model(data) {
    Object.assign(this, clone(data));
    this._id = this._id || generateId();
    
    // Copy methods from schema.methods
    if (schema && schema.methods) {
      for (const methodName in schema.methods) {
        this[methodName] = schema.methods[methodName].bind(this);
      }
    }
  }

  Model.modelName = modelName;

  Model.prototype.save = async function() {
    const collectionName = modelName.toLowerCase() + 's';
    const collection = db[collectionName];

    // Call pre('save') hooks
    if (schema && schema.pres && schema.pres['save']) {
      await new Promise((resolve, reject) => {
        schema.pres['save'].call(this, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    const existingIdx = collection.findIndex(item => item._id.toString() === this._id.toString());
    if (existingIdx >= 0) {
      collection[existingIdx] = clone(this);
    } else {
      collection.push(clone(this));
    }
    return this;
  };

  Model.find = function(query) {
    const collectionName = modelName.toLowerCase() + 's';
    let results = clone(db[collectionName]);

    if (query) {
      results = results.filter(item => {
        for (const key in query) {
          if (key === '$or') {
            return query.$or.some(subQuery => {
              return Object.keys(subQuery).every(subKey => {
                return item[subKey] === subQuery[subKey];
              });
            });
          }
          if (item[key] !== query[key]) return false;
        }
        return true;
      });
    }

    const modelInstances = results.map(item => new Model(item));
    return createQueryChain(modelInstances);
  };

  Model.findOne = function(query) {
    const collectionName = modelName.toLowerCase() + 's';
    let results = clone(db[collectionName]);

    if (query) {
      results = results.filter(item => {
        for (const key in query) {
          if (key === '$or') {
            return query.$or.some(subQuery => {
              return Object.keys(subQuery).every(subKey => {
                const val = subQuery[subKey];
                if (val instanceof RegExp) {
                  return val.test(item[subKey] || '');
                }
                if (typeof val === 'string' && typeof item[subKey] === 'string') {
                  return val.toLowerCase() === item[subKey].toLowerCase();
                }
                return item[subKey] === val;
              });
            });
          }
          const val = query[key];
          if (val instanceof RegExp) {
            if (!val.test(item[key] || '')) return false;
          } else if (typeof val === 'string' && typeof item[key] === 'string') {
            if (val.toLowerCase() !== item[key].toLowerCase()) return false;
          } else {
            if (item[key] !== val) return false;
          }
        }
        return true;
      });
    }

    const result = results.length > 0 ? results[0] : null;
    return createQueryChain(result ? new Model(result) : null);
  };

  Model.findById = function(id) {
    if (!id) return createQueryChain(null);
    const idStr = id.toString();
    const collectionName = modelName.toLowerCase() + 's';
    const result = db[collectionName].find(item => item._id.toString() === idStr);
    return createQueryChain(result ? new Model(result) : null);
  };

  Model.findByIdAndUpdate = function(id, update, options) {
    const idStr = id.toString();
    const collectionName = modelName.toLowerCase() + 's';
    const idx = db[collectionName].findIndex(item => item._id.toString() === idStr);
    if (idx >= 0) {
      const item = db[collectionName][idx];
      if (update.$set) {
        Object.assign(item, update.$set);
      } else {
        Object.assign(item, update);
      }
      db[collectionName][idx] = item;
      return createQueryChain(new Model(item));
    }
    return createQueryChain(null);
  };

  Model.deleteOne = function(query) {
    const collectionName = modelName.toLowerCase() + 's';
    const initialLen = db[collectionName].length;
    if (query && query._id) {
      const idStr = query._id.toString();
      db[collectionName] = db[collectionName].filter(item => item._id.toString() !== idStr);
    }
    return createQueryChain({ deletedCount: initialLen - db[collectionName].length });
  };

  models[modelName] = Model;
  return Model;
}

const connect = async () => {
  console.log('MOCK MONGOOSE: Connected successfully to in-memory database!');
  return true;
};

const mongooseMock = {
  Schema,
  model,
  connect,
  connection: {
    readyState: 1,
    on: () => {},
    once: () => {}
  },
  models
};

Schema.Types = {
  ObjectId: String
};
mongooseMock.Schema.Types = Schema.Types;

module.exports = mongooseMock;
