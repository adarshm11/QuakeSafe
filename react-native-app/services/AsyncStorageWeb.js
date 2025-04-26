// Simple AsyncStorage implementation for web
const AsyncStorageWeb = {
  getItem: (key) => {
    try {
      return Promise.resolve(localStorage.getItem(key));
    } catch (e) {
      return Promise.resolve(null);
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
      return Promise.resolve();
    } catch (e) {
      return Promise.resolve();
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
      return Promise.resolve();
    } catch (e) {
      return Promise.resolve();
    }
  },
  clear: () => {
    try {
      localStorage.clear();
      return Promise.resolve();
    } catch (e) {
      return Promise.resolve();
    }
  },
  getAllKeys: () => {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        keys.push(localStorage.key(i));
      }
      return Promise.resolve(keys);
    } catch (e) {
      return Promise.resolve([]);
    }
  },
};

export default AsyncStorageWeb;
