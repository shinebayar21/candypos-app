import { combineReducers, configureStore } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { appReducer } from "./app-slice";
import { authReducer } from "./auth-slice";
import { catalogReducer } from "./catalog-slice";
import { inventoryReducer } from "./inventory-slice";
import { countReducer } from "./count-slice";
import { sessionsReducer } from "./sessions-slice";
import { outboxReducer } from "./outbox-slice";
import { remoteCountsReducer } from "./remote-counts-slice";
import { syncReducer } from "./sync-slice";
import { lockReducer } from "./lock-slice";

const persistConfig = {
  // v2: өгөгдлийн загвар өөрчлөгдсөн тул хуучин persist-ийг үл хэрэгснэ.
  key: "candypos-v2",
  storage: AsyncStorage,
  // sync (runtime online/status)-аас бусдыг бүгдийг offline хадгална.
  whitelist: [
    "app",
    "auth",
    "catalog",
    "inventory",
    "count",
    "sessions",
    "outbox",
    "remoteCounts",
  ],
};

const rootReducer = combineReducers({
  app: appReducer,
  auth: authReducer,
  catalog: catalogReducer,
  inventory: inventoryReducer,
  count: countReducer,
  sessions: sessionsReducer,
  outbox: outboxReducer,
  remoteCounts: remoteCountsReducer,
  sync: syncReducer,
  lock: lockReducer, // persist хийгдэхгүй (whitelist-д байхгүй)
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
export { store, persistor };
