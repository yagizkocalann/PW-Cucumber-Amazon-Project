import { setWorldConstructor } from "@cucumber/cucumber";
import { CustomWorld } from "./world";

setWorldConstructor(CustomWorld);
