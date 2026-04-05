import { AppConfiguration } from "../interfaces/appConfiguration";

declare global {
  var AppConfig: AppConfiguration;
  namespace NodeJS {
    interface Global {
      AppConfig: AppConfiguration;
    }
  }
}

export {};
