"use strict";
// src/backend/models.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionType = exports.EntityState = exports.InteractiveMode = void 0;
var InteractiveMode;
(function (InteractiveMode) {
    InteractiveMode["Grabbable"] = "grabbable";
    InteractiveMode["Interactive"] = "interactive";
    InteractiveMode["NotInteractive"] = "notInteractive";
})(InteractiveMode || (exports.InteractiveMode = InteractiveMode = {}));
var EntityState;
(function (EntityState) {
    EntityState["World"] = "world";
    EntityState["Inventory"] = "inventory";
    EntityState["Void"] = "void"; // Not in world or inventory (can be activated)
})(EntityState || (exports.EntityState = EntityState = {}));
var ActionType;
(function (ActionType) {
    ActionType["PlaySound"] = "playSound";
    ActionType["AddToInventory"] = "addToInventory";
    ActionType["RemoveFromInventory"] = "removeFromInventory";
    ActionType["RemoveFromInventoryByName"] = "removeFromInventoryByName";
    ActionType["GrantToInventory"] = "grantToInventory";
    ActionType["SpawnEntity"] = "spawnEntity";
    ActionType["ClearEntity"] = "clearEntity";
    ActionType["SetInteractive"] = "setInteractive";
    ActionType["SetInteractiveByName"] = "setInteractiveByName";
    ActionType["ActivateQuest"] = "activateQuest";
    ActionType["AdvanceStep"] = "advanceStep";
    ActionType["ChangeLocation"] = "changeLocation";
    ActionType["StartDialogue"] = "startDialogue"; // Dialogue sequence ID
})(ActionType || (exports.ActionType = ActionType = {}));
