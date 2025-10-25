// data.ts - Embedded game data for QuestEngine
// Auto-generated from dataDemo/*.json files

export const EMBEDDED_LOCATIONS = [
  {
    "id": "main_stage",
    "name": "Main Stage",
    "backgroundMusic": "/assets/music/forest.mp3",
    "image": "http://localhost:5173/assets/images/hobbit-land.jpg",
    "items": [
      "special_mushroom",
      "special_mushroom_1",
      "special_mushroom_6",
      "special_mushroom_5",
      "special_mushroom_4",
      "special_mushroom_3",
      "special_mushroom_2",
      "special_mushroom_7",
      "special_mushroom_8",
      "special_mushroom_9",
      "special_mushroom_10",
      "special_mushroom_11",
      "bass_string",
      "stage_glb",
      "boulder_blocking",
      "cave_glb",
      "boulder_unblocking",
      "debris_pile_1"
    ],
    "npcs": [
      "persephone"
    ],
    "portals": [
      "portal_to_cave",
      "portal_to_abyss"
    ]
  },
  {
    "id": "mycelium_caves",
    "name": "Mycelium Caves",
    "backgroundMusic": "/assets/music/midnight-dreary.mp3",
    "image": "http://localhost:5173/assets/images/mordor.jpg",
    "items": [
      "bass_string",
      "crystal_2",
      "crystal_3",
      "crystal_4",
      "crystal_5",
      "crystal_6",
      "crystal_7",
      "crystal_8",
      "crystal_9",
      "crystal_10",
      "vessel_1",
      "vessel_2",
      "vessel_3",
      "vessel_4",
      "vessel_5",
      "pomegranate_seed",
      "pomegranate_seed_2",
      "pomegranate_seed_1",
      "pomegranate_seed_3",
      "pomegranate_seed_4",
      "debris_pile_1",
      "debris_pile"
    ],
    "npcs": [
      "bassimus",
      "crystallia",
      "echo",
      "persephone"
    ],
    "portals": [
      "portal_to_main_stage"
    ]
  },
  {
    "id": "abyss",
    "name": "Abyss",
    "backgroundMusic": "",
    "image": "/assets/images/Achievement_Zone_ZaralekCavern.png",
    "items": [
      "cat",
      "crystal_7"
    ],
    "npcs": [
      "pumpking_guy"
    ],
    "portals": [
      "new_portal_xd_1"
    ]
  },
  {
    "id": "test",
    "name": "Test",
    "backgroundMusic": "",
    "image": "/assets/images/Achievement_Zone_ZaralekCavern.png",
    "items": [
      "cat",
      "crystal_7"
    ],
    "npcs": [
      "pumpking_guy"
    ],
    "portals": [
      "new_portal_xd_1"
    ]
  },
  {
    "id": "parent_location",
    "name": "Parent Location (No Children)",
    "backgroundMusic": "/assets/music/forest.mp3",
    "image": "http://localhost:5173/assets/images/hobbit-land.jpg",
    "items": [],
    "npcs": [],
    "portals": [
      "portal_to_child_parent"
    ]
  },
  {
    "id": "child_parent_location",
    "name": "Child Parent Location",
    "backgroundMusic": "/assets/music/forest.mp3",
    "image": "http://localhost:5173/assets/images/hobbit-land.jpg",
    "items": [],
    "npcs": [],
    "portals": [
      "portal_to_parent"
    ],
    "locations": [
      "child_location_1",
      "child_location_2"
    ]
  },
  {
    "id": "child_location_1",
    "name": "Child Location 1",
    "backgroundMusic": "/assets/music/forest.mp3",
    "image": "http://localhost:5173/assets/images/hobbit-land.jpg",
    "items": [
      "special_mushroom"
    ],
    "npcs": [],
    "portals": []
  },
  {
    "id": "child_location_2",
    "name": "Child Location 2",
    "backgroundMusic": "/assets/music/forest.mp3",
    "image": "http://localhost:5173/assets/images/hobbit-land.jpg",
    "items": [
      "crystal_2"
    ],
    "npcs": [],
    "portals": []
  }
];

export const EMBEDDED_QUESTS = [
  {
    "id": "enter_mycelium_cave",
    "chapter": "The Mycelium Cave",
    "title": "Enter Mycelium Cave",
    "description": "Go through the portal into the mycelium cave",
    "order": 0,
    "steps": [
      {
        "id": "go_through_portal_into_the_mycelium_cave",
        "name": "Go through portal into the mycelium cave",
        "objectiveType": "goToLocation",
        "objectiveParams": {
          "locationId": "mycelium_caves"
        },
        "onStart": [],
        "onComplete": [
          {
            "type": "activateQuest",
            "params": {
              "questId": "deep_tunes"
            }
          },
          {
            "type": "activateQuest",
            "params": {
              "questId": "help_persephone_find_her_light"
            }
          }
        ],
        "isCompleted": true
      }
    ],
    "activeStepId": "find_crystal",
    "completed": true
  },
  {
    "id": "deep_tunes",
    "chapter": "The Mycelium Cave",
    "title": "Deep Tunes",
    "description": "Help Bassimus find a new bass string so he can play his groovy riffs and clear the boulder blocking the path.",
    "order": 1,
    "steps": [
      {
        "id": "talk_to_bassimus",
        "name": "Talk to Bassimus",
        "objectiveType": "talkTo",
        "objectiveParams": {
          "npcId": "bassimus"
        },
        "onStart": [],
        "onComplete": [],
        "isCompleted": true
      },
      {
        "id": "find_the_bass_string",
        "name": "Find the Bass String",
        "objectiveType": "collectEntities",
        "objectiveParams": {
          "entityIds": [
            "bass_string"
          ]
        },
        "onStart": [
          {
            "type": "setInteractiveByName",
            "params": {
              "itemName": "Bass String",
              "interactiveMode": "grabbable"
            }
          }
        ],
        "onComplete": [],
        "isCompleted": true
      },
      {
        "id": "return_to_bassimus",
        "name": "Return to Bassimus",
        "objectiveType": "talkTo",
        "objectiveParams": {
          "npcId": "bassimus"
        },
        "onStart": [],
        "onComplete": [
          {
            "type": "clearEntity",
            "params": {
              "entityId": "boulder"
            }
          },
          {
            "type": "activateQuest",
            "params": {
              "questId": "the_mirror_self"
            }
          },
          {
            "type": "removeFromInventoryByName",
            "params": {
              "itemName": "Bass String"
            }
          }
        ],
        "isCompleted": false
      }
    ],
    "completed": false,
    "activeStepId": "return_to_bassimus"
  },
  {
    "id": "the_mirror_self",
    "chapter": "The Mycelium Cave",
    "title": "The Mirror Self",
    "description": "Help Echo get crystals from Crystallia, but beware the consequences!",
    "order": 2,
    "steps": [
      {
        "id": "talk_to_echo",
        "name": "Talk to Echo",
        "objectiveType": "talkTo",
        "objectiveParams": {
          "npcId": "echo"
        },
        "onStart": [],
        "onComplete": [],
        "isCompleted": false
      },
      {
        "id": "get_the_crystals",
        "name": "Get the Crystals",
        "objectiveType": "collectByName",
        "objectiveParams": {
          "itemName": "Crystal",
          "count": 5
        },
        "onStart": [
          {
            "type": "setInteractiveByName",
            "params": {
              "itemName": "Crystal",
              "interactiveMode": "grabbable"
            }
          }
        ],
        "onComplete": [
          {
            "type": "spawnEntity",
            "params": {
              "entityId": "debris_pile"
            }
          },
          {
            "type": "spawnEntity",
            "params": {
              "entityId": "debris_pile_1"
            }
          },
          {
            "type": "startDialogue",
            "params": {
              "dialogueSequenceId": "echo_echo_earthquake_reaction"
            }
          }
        ],
        "isCompleted": false
      },
      {
        "id": "bring_crystals_to_echo",
        "name": "Bring Crystals to Echo",
        "objectiveType": "talkTo",
        "objectiveParams": {
          "npcId": "echo"
        },
        "onStart": [],
        "onComplete": [
          {
            "type": "removeFromInventoryByName",
            "params": {
              "itemName": "Crystal",
              "count": 6
            }
          },
          {
            "type": "activateQuest",
            "params": {
              "questId": "the_mushroom_run"
            }
          }
        ],
        "isCompleted": false
      }
    ],
    "completed": false
  },
  {
    "id": "the_mushroom_run",
    "chapter": "The Mycelium Cave",
    "title": "The Mushroom Run",
    "description": "Return to the surface world and collect 10 special mushrooms to clear the debris blocking the path.",
    "order": 3,
    "steps": [
      {
        "id": "go_to_the_shrooms",
        "name": "Go to the Shrooms",
        "objectiveType": "goToLocation",
        "objectiveParams": {
          "locationId": "main_stage"
        },
        "onStart": [],
        "onComplete": [],
        "isCompleted": false
      },
      {
        "id": "collect_mushrooms",
        "name": "Collect Mushrooms",
        "objectiveType": "collectByName",
        "objectiveParams": {
          "itemName": "Special Mushroom",
          "count": 3
        },
        "onStart": [
          {
            "type": "setInteractiveByName",
            "params": {
              "itemName": "Special Mushroom",
              "interactiveMode": "grabbable"
            }
          }
        ],
        "onComplete": [
          {
            "type": "startDialogue",
            "params": {
              "dialogueSequenceId": "echo_mushroom_completion"
            }
          }
        ],
        "isCompleted": false
      },
      {
        "id": "return_to_the_caves",
        "name": "Return to the Caves",
        "objectiveType": "goToLocation",
        "objectiveParams": {
          "locationId": "mycelium_caves"
        },
        "onStart": [],
        "onComplete": [],
        "isCompleted": false
      },
      {
        "id": "bring_echo_mushrooms",
        "name": "Bring Echo Mushrooms",
        "objectiveType": "talkTo",
        "objectiveParams": {
          "npcId": "echo"
        },
        "onStart": [],
        "onComplete": [
          {
            "type": "removeFromInventoryByName",
            "params": {
              "itemName": "Special Mushroom",
              "count": 2
            }
          },
          {
            "type": "clearEntity",
            "params": {
              "entityId": "debris_pile_1"
            }
          },
          {
            "type": "activateQuest",
            "params": {
              "questId": "help_persephone_find_her_light"
            }
          }
        ],
        "isCompleted": false
      }
    ],
    "completed": false
  },
  {
    "id": "help_persephone_find_her_light",
    "chapter": "The Mycelium Cave",
    "title": "Help Persephone Find Her Light",
    "description": "Help Persephone escape her curse by collecting pomegranate seeds and opening the portal.",
    "order": 4,
    "steps": [
      {
        "id": "meet_persephone",
        "name": "Meet Persephone",
        "objectiveType": "talkTo",
        "objectiveParams": {
          "npcId": "persephone"
        },
        "onStart": [],
        "onComplete": [],
        "isCompleted": false
      },
      {
        "id": "activate_portal",
        "name": "Activate Portal",
        "objectiveType": "custom",
        "objectiveParams": {
          "targetId": "seeds_placed",
          "requiredCount": 5
        },
        "onStart": [
          {
            "type": "spawnEntity",
            "params": {
              "entityId": "pomegranate_seed"
            }
          },
          {
            "type": "spawnEntity",
            "params": {
              "entityId": "pomegranate_seed_2"
            }
          },
          {
            "type": "spawnEntity",
            "params": {
              "entityId": "pomegranate_seed_1"
            }
          },
          {
            "type": "spawnEntity",
            "params": {
              "entityId": "pomegranate_seed_3"
            }
          },
          {
            "type": "spawnEntity",
            "params": {
              "entityId": "pomegranate_seed_4"
            }
          },
          {
            "type": "setInteractiveByName",
            "params": {
              "itemName": "Pomegranate Seed",
              "interactiveMode": "grabbable"
            }
          }
        ],
        "onComplete": [],
        "isCompleted": false
      },
      {
        "id": "convince_persephone",
        "name": "Convince Persephone",
        "objectiveType": "custom",
        "objectiveParams": {
          "targetId": "persephone_convinced"
        },
        "onStart": [],
        "onComplete": [
          {
            "type": "setInteractive",
            "params": {
              "entityId": "portal_to_abyss",
              "interactiveMode": "touchable"
            }
          }
        ],
        "isCompleted": false
      }
    ],
    "completed": false
  },
  {
    "id": "its_halloween",
    "chapter": "Chapter Halloween",
    "title": "It's Halloween!",
    "description": "Help Pumpkin Guy to find his lost cat",
    "order": 5,
    "steps": [
      {
        "id": "talk_to_pumpkin_guy",
        "name": "Talk to Pumpkin Guy",
        "objectiveType": "talkTo",
        "objectiveParams": {
          "npcId": "pumpking_guy"
        },
        "onStart": [],
        "onComplete": []
      },
      {
        "id": "find_cat_mew",
        "name": "Find Cat Mew",
        "objectiveType": "collectByName",
        "objectiveParams": {
          "itemName": "Cat",
          "count": 1
        },
        "onStart": [
          {
            "type": "spawnEntity",
            "params": {
              "entityId": "cat"
            }
          }
        ],
        "onComplete": []
      },
      {
        "id": "bring_mew_back_to_pumpkin_guy",
        "name": "Bring Mew Back to Pumpkin Guy",
        "objectiveType": "talkTo",
        "objectiveParams": {
          "npcId": "pumpking_guy"
        },
        "onStart": [],
        "onComplete": []
      }
    ],
    "completed": false
  }
];

export const EMBEDDED_NPCS = [
  {
    "id": "bassimus",
    "name": "Bassimus",
    "image": "http://localhost:5173/assets/images/npc_shroom.png",
    "state": "world",
    "dialogueSequences": [
      "bassimus_quest_start",
      "bassimus_default",
      "bassimus_searching_reminder",
      "bassimus_string_returned"
    ],
    "spawned": true,
    "cleared": false,
    "onInteract": []
  },
  {
    "id": "crystallia",
    "name": "Crystallia",
    "image": "http://localhost:5173/assets/images/npc_3.png",
    "state": "world",
    "dialogueSequences": [
      "crystallia_warning",
      "crystallia_touch_3_crystals",
      "crystallia_touch_5_crystals",
      "crystallia_touch_6_crystals",
      "crystallia_second_visit_warning",
      "crystallia_steal_3_crystals",
      "crystallia_steal_5_crystals",
      "crystallia_steal_6_crystals",
      "crystallia_after_earthquake",
      "crystallia_mushroom_quest_interaction"
    ],
    "spawned": true,
    "cleared": false,
    "onInteract": []
  },
  {
    "id": "echo",
    "name": "Echo",
    "image": "http://localhost:5173/assets/images/npc_1.png",
    "state": "world",
    "dialogueSequences": [
      "echo_quest_start",
      "echo_earthquake_reaction",
      "echo_after_earthquake",
      "echo_crystal_quest_active",
      "echo_crystal_reminder",
      "echo_after_crystal_stealing",
      "echo_mushroom_reminder",
      "echo_mushroom_completion",
      "echo_mushrooms_delivered",
      "echo_confront_echo",
      "echo_default"
    ],
    "spawned": true,
    "cleared": false,
    "onInteract": []
  },
  {
    "id": "persephone",
    "name": "Persephone",
    "image": "http://localhost:5173/assets/images/npc_4.png",
    "state": "world",
    "dialogueSequences": [
      "persephone_initial_meeting",
      "persephone_seed_reminder",
      "persephone_portal_convincing",
      "persephone_convinced_followup"
    ],
    "spawned": true,
    "cleared": false,
    "onInteract": []
  },
  {
    "id": "bunny_cave",
    "name": "Bunny Cave",
    "image": "http://localhost:5173/assets/images/npc_2.png",
    "state": "world",
    "dialogueSequences": [],
    "spawned": true,
    "cleared": false,
    "onInteract": []
  },
  {
    "id": "pumpking_guy",
    "name": "Pumpking Guy",
    "image": "/assets/images/pumpkin.png",
    "state": "world"
  }
];

export const EMBEDDED_ITEMS = [
  {
    "id": "bass_string",
    "name": "Bass String",
    "image": "http://localhost:5173/assets/images/ring.png",
    "state": "world",
    "interactive": "notInteractive",
    "onInteract": []
  },
  {
    "id": "crystal",
    "name": "Crystal",
    "image": "http://localhost:5173/assets/images/crystal_6.png",
    "state": "world",
    "interactive": "touchable",
    "onInteract": [
      {
        "type": "custom",
        "params": {
          "action": "touch_crystal",
          "crystalId": "crystal_1"
        }
      }
    ]
  },
  {
    "id": "crystal_2",
    "name": "Crystal",
    "image": "http://localhost:5173/assets/images/crystal_6.png",
    "state": "world",
    "interactive": "touchable",
    "onInteract": [
      {
        "type": "custom",
        "params": {
          "action": "touch_crystal",
          "crystalId": "crystal_2"
        }
      }
    ]
  },
  {
    "id": "crystal_3",
    "name": "Crystal",
    "image": "http://localhost:5173/assets/images/crystal_6.png",
    "state": "world",
    "interactive": "touchable",
    "onInteract": [
      {
        "type": "custom",
        "params": {
          "action": "touch_crystal",
          "crystalId": "crystal_3"
        }
      }
    ]
  },
  {
    "id": "crystal_4",
    "name": "Crystal",
    "image": "http://localhost:5173/assets/images/crystal_6.png",
    "state": "world",
    "interactive": "touchable",
    "onInteract": [
      {
        "type": "custom",
        "params": {
          "action": "touch_crystal",
          "crystalId": "crystal_4"
        }
      }
    ]
  },
  {
    "id": "crystal_5",
    "name": "Crystal",
    "image": "http://localhost:5173/assets/images/crystal_6.png",
    "state": "world",
    "interactive": "touchable",
    "onInteract": [
      {
        "type": "custom",
        "params": {
          "action": "touch_crystal",
          "crystalId": "crystal_5"
        }
      }
    ]
  },
  {
    "id": "crystal_6",
    "name": "Crystal",
    "image": "http://localhost:5173/assets/images/crystal_6.png",
    "state": "world",
    "interactive": "touchable",
    "onInteract": [
      {
        "type": "custom",
        "params": {
          "action": "touch_crystal",
          "crystalId": "crystal_6"
        }
      }
    ]
  },
  {
    "id": "crystal_7",
    "name": "Crystal",
    "image": "http://localhost:5173/assets/images/crystal_6.png",
    "state": "world",
    "interactive": "touchable",
    "onInteract": [
      {
        "type": "custom",
        "params": {
          "action": "touch_crystal",
          "crystalId": "crystal_7"
        }
      }
    ]
  },
  {
    "id": "crystal_8",
    "name": "Crystal",
    "image": "http://localhost:5173/assets/images/crystal_6.png",
    "state": "world",
    "interactive": "touchable",
    "onInteract": [
      {
        "type": "custom",
        "params": {
          "action": "touch_crystal",
          "crystalId": "crystal_8"
        }
      }
    ]
  },
  {
    "id": "crystal_9",
    "name": "Crystal",
    "image": "http://localhost:5173/assets/images/crystal_6.png",
    "state": "world",
    "interactive": "touchable",
    "onInteract": [
      {
        "type": "custom",
        "params": {
          "action": "touch_crystal",
          "crystalId": "crystal_9"
        }
      }
    ]
  },
  {
    "id": "crystal_10",
    "name": "Crystal",
    "image": "http://localhost:5173/assets/images/crystal_6.png",
    "state": "world",
    "interactive": "touchable",
    "onInteract": [
      {
        "type": "custom",
        "params": {
          "action": "touch_crystal",
          "crystalId": "crystal_10"
        }
      }
    ]
  },
  {
    "id": "pomegranate_seed",
    "name": "Pomegranate Seed",
    "image": "http://localhost:5173/assets/images/crystal_2.png",
    "state": "void",
    "interactive": "grabbable",
    "onInteract": [
      {
        "type": "custom",
        "params": {
          "action": "collect_seed"
        }
      }
    ]
  },
  {
    "id": "pomegranate_seed_2",
    "name": "Pomegranate Seed",
    "image": "http://localhost:5173/assets/images/crystal_2.png",
    "state": "void",
    "interactive": "grabbable",
    "onInteract": [
      {
        "type": "custom",
        "params": {
          "action": "collect_seed"
        }
      }
    ]
  },
  {
    "id": "pomegranate_seed_1",
    "name": "Pomegranate Seed",
    "image": "http://localhost:5173/assets/images/crystal_2.png",
    "state": "void",
    "interactive": "grabbable",
    "onInteract": [
      {
        "type": "custom",
        "params": {
          "action": "collect_seed"
        }
      }
    ]
  },
  {
    "id": "pomegranate_seed_3",
    "name": "Pomegranate Seed",
    "image": "http://localhost:5173/assets/images/crystal_2.png",
    "state": "void",
    "interactive": "grabbable",
    "onInteract": [
      {
        "type": "custom",
        "params": {
          "action": "collect_seed"
        }
      }
    ]
  },
  {
    "id": "pomegranate_seed_4",
    "name": "Pomegranate Seed",
    "image": "http://localhost:5173/assets/images/crystal_2.png",
    "state": "void",
    "interactive": "grabbable",
    "onInteract": [
      {
        "type": "custom",
        "params": {
          "action": "collect_seed"
        }
      }
    ]
  },
  {
    "id": "vessel_1",
    "name": "Ancient Vessel 1",
    "image": "http://localhost:5173/assets/images/crystal_1.png",
    "state": "world",
    "interactive": "touchable",
    "onInteract": [
      {
        "type": "custom",
        "params": {
          "action": "place_seed",
          "vesselId": "vessel_1"
        }
      }
    ]
  },
  {
    "id": "vessel_2",
    "name": "Ancient Vessel 2",
    "image": "http://localhost:5173/assets/images/crystal_1.png",
    "state": "world",
    "interactive": "touchable",
    "onInteract": [
      {
        "type": "custom",
        "params": {
          "action": "place_seed",
          "vesselId": "vessel_2"
        }
      }
    ]
  },
  {
    "id": "vessel_3",
    "name": "Ancient Vessel 3",
    "image": "http://localhost:5173/assets/images/crystal_1.png",
    "state": "world",
    "interactive": "touchable",
    "onInteract": [
      {
        "type": "custom",
        "params": {
          "action": "place_seed",
          "vesselId": "vessel_3"
        }
      }
    ]
  },
  {
    "id": "vessel_4",
    "name": "Ancient Vessel 4",
    "image": "http://localhost:5173/assets/images/crystal_1.png",
    "state": "world",
    "interactive": "touchable",
    "onInteract": [
      {
        "type": "custom",
        "params": {
          "action": "place_seed",
          "vesselId": "vessel_4"
        }
      }
    ]
  },
  {
    "id": "vessel_5",
    "name": "Ancient Vessel 5",
    "image": "http://localhost:5173/assets/images/crystal_1.png",
    "state": "world",
    "interactive": "touchable",
    "onInteract": [
      {
        "type": "custom",
        "params": {
          "action": "place_seed",
          "vesselId": "vessel_5"
        }
      }
    ]
  },
  {
    "id": "special_mushroom",
    "name": "Special Mushroom",
    "image": "http://localhost:5173/assets/images/shroom_3.png",
    "state": "world",
    "interactive": "notInteractive",
    "onInteract": []
  },
  {
    "id": "special_mushroom_1",
    "name": "Special Mushroom",
    "image": "http://localhost:5173/assets/images/shroom_3.png",
    "state": "world",
    "interactive": "notInteractive",
    "onInteract": []
  },
  {
    "id": "special_mushroom_2",
    "name": "Special Mushroom",
    "image": "http://localhost:5173/assets/images/shroom_3.png",
    "state": "world",
    "interactive": "notInteractive",
    "onInteract": []
  },
  {
    "id": "special_mushroom_3",
    "name": "Special Mushroom",
    "image": "http://localhost:5173/assets/images/shroom_3.png",
    "state": "world",
    "interactive": "notInteractive",
    "onInteract": []
  },
  {
    "id": "special_mushroom_4",
    "name": "Special Mushroom",
    "image": "http://localhost:5173/assets/images/shroom_3.png",
    "state": "world",
    "interactive": "notInteractive",
    "onInteract": []
  },
  {
    "id": "special_mushroom_5",
    "name": "Special Mushroom",
    "image": "http://localhost:5173/assets/images/shroom_3.png",
    "state": "world",
    "interactive": "notInteractive",
    "onInteract": []
  },
  {
    "id": "special_mushroom_6",
    "name": "Special Mushroom",
    "image": "http://localhost:5173/assets/images/shroom_3.png",
    "state": "world",
    "interactive": "notInteractive",
    "onInteract": []
  },
  {
    "id": "special_mushroom_7",
    "name": "Special Mushroom",
    "image": "http://localhost:5173/assets/images/shroom_3.png",
    "state": "world",
    "interactive": "notInteractive",
    "onInteract": []
  },
  {
    "id": "special_mushroom_8",
    "name": "Special Mushroom",
    "image": "http://localhost:5173/assets/images/shroom_3.png",
    "state": "world",
    "interactive": "notInteractive",
    "onInteract": []
  },
  {
    "id": "special_mushroom_9",
    "name": "Special Mushroom",
    "image": "http://localhost:5173/assets/images/shroom_3.png",
    "state": "world",
    "interactive": "notInteractive",
    "onInteract": []
  },
  {
    "id": "special_mushroom_10",
    "name": "Special Mushroom",
    "image": "http://localhost:5173/assets/images/shroom_3.png",
    "state": "world",
    "interactive": "notInteractive",
    "onInteract": []
  },
  {
    "id": "special_mushroom_11",
    "name": "Special Mushroom",
    "image": "http://localhost:5173/assets/images/shroom_3.png",
    "state": "world",
    "interactive": "notInteractive",
    "onInteract": []
  },
  {
    "id": "boulder_blocking",
    "name": "Boulder Blocking",
    "image": "http://localhost:5173/assets/images/boulder.png",
    "state": "world",
    "interactive": "notInteractive",
    "onInteract": []
  },
  {
    "id": "debris_pile",
    "name": "Debris Pile",
    "image": "http://localhost:5173/assets/images/rune_stone.png",
    "state": "void",
    "interactive": "notInteractive",
    "onInteract": []
  },
  {
    "id": "debris_pile_1",
    "name": "Debris Pile",
    "image": "http://localhost:5173/assets/images/rune_stone.png",
    "state": "void",
    "interactive": "notInteractive",
    "onInteract": []
  },
  {
    "id": "stage_glb",
    "name": "Stage GLB",
    "image": "/assets/images/Trade_Archaeology_Sand Castle.png",
    "state": "world",
    "interactive": "notInteractive",
    "onInteract": []
  },
  {
    "id": "cave_glb",
    "name": "Cave GLB",
    "image": "/assets/images/Achievement_Zone_ZaralekCavern.png",
    "state": "world",
    "interactive": "grabbable",
    "onInteract": []
  },
  {
    "id": "boulder_unblocking",
    "name": "Boulder Unblocking",
    "image": "http://localhost:5173/assets/images/boulder.png",
    "state": "void",
    "interactive": "notInteractive",
    "onInteract": []
  },
  {
    "id": "stage_2_face_previes",
    "name": "stage 2 face previes",
    "image": "/assets/images/INV_BabyTentacleFace_Pale.png",
    "state": "world",
    "interactive": "notInteractive",
    "onInteract": []
  },
  {
    "id": "cat",
    "name": "Cat",
    "image": "/assets/images/Spell_Misc_PetHeal.png",
    "state": "void",
    "interactive": "grabbable",
    "onInteract": []
  }
];

export const EMBEDDED_PORTALS = [
  {
    "id": "portal_to_cave",
    "name": "Portal to Cave",
    "image": "http://localhost:5173/assets/images/portal_3.png",
    "state": "world",
    "interactive": "touchable",
    "onInteract": [
      {
        "type": "changeLocation",
        "params": {
          "locationId": "mycelium_caves"
        }
      }
    ],
    "destinationLocationId": "mycelium_caves"
  },
  {
    "id": "portal_to_main_stage",
    "name": "Portal to Main Stage",
    "image": "http://localhost:5173/assets/images/portal_2.png",
    "state": "world",
    "interactive": "touchable",
    "onInteract": [
      {
        "type": "changeLocation",
        "params": {
          "locationId": "main_stage"
        }
      }
    ],
    "destinationLocationId": "main_stage"
  },
  {
    "id": "new_portal",
    "name": "New Portal",
    "image": "/assets/images/Spell_Magic_PolymorphChicken.png",
    "state": "world",
    "interactive": "grabbable",
    "onInteract": [
      {
        "type": "changeLocation",
        "params": {
          "locationId": "mycelium_caves"
        }
      }
    ],
    "destinationLocationId": "mycelium_caves"
  },
  {
    "id": "new_portal_1",
    "name": "New Portal",
    "image": "/assets/images/npc_3.png",
    "state": "world",
    "interactive": "touchable",
    "onInteract": [
      {
        "type": "changeLocation",
        "params": {
          "locationId": "abyss"
        }
      }
    ],
    "destinationLocationId": "abyss"
  },
  {
    "id": "new_portal_2",
    "name": "New Portal",
    "image": "/assets/images/icon-set.png",
    "state": "world",
    "interactive": "touchable",
    "onInteract": [
      {
        "type": "changeLocation",
        "params": {
          "locationId": "main_stage"
        }
      }
    ],
    "destinationLocationId": "main_stage"
  },
  {
    "id": "portal_to_abyss",
    "name": "Portal to Abyss",
    "image": "/assets/images/crystal_3.png",
    "state": "world",
    "interactive": "interactive",
    "onInteract": [
      {
        "type": "changeLocation",
        "params": {
          "locationId": "abyss"
        }
      }
    ],
    "destinationLocationId": "abyss"
  },
  {
    "id": "new_portal_xd_1",
    "name": "New Portal xd",
    "image": "/assets/images/Spell_Magic_PolymorphRabbit.png",
    "state": "world",
    "interactive": "interactive",
    "onInteract": [
      {
        "type": "changeLocation",
        "params": {
          "locationId": "main_stage"
        }
      }
    ],
    "destinationLocationId": "main_stage"
  },
  {
    "id": "new_portal_xd",
    "name": "New Portal xd",
    "image": "/assets/images/particle.png",
    "state": "world",
    "interactive": "touchable",
    "onInteract": [
      {
        "type": "changeLocation",
        "params": {
          "locationId": "mycelium_caves"
        }
      }
    ],
    "destinationLocationId": "mycelium_caves"
  },
  {
    "id": "portal_to_child_parent",
    "name": "Portal to Child Parent Location",
    "image": "/assets/images/portal_2.png",
    "state": "world",
    "interactive": "touchable",
    "onInteract": [
      {
        "type": "changeLocation",
        "params": {
          "locationId": "child_parent_location"
        }
      }
    ],
    "destinationLocationId": "child_parent_location"
  },
  {
    "id": "portal_to_parent",
    "name": "Portal to Parent Location",
    "image": "/assets/images/portal_3.png",
    "state": "world",
    "interactive": "touchable",
    "onInteract": [
      {
        "type": "changeLocation",
        "params": {
          "locationId": "parent_location"
        }
      }
    ],
    "destinationLocationId": "parent_location"
  }
];

export const EMBEDDED_DIALOGUES = [
  {
    "id": "bassimus_looking_for_my_bass_string",
    "name": "Looking for my Bass String",
    "npcId": "bassimus",
    "questStepId": "talk_to_bassimus",
    "dialogs": [
      {
        "id": "hey_dude",
        "text": "Hey dude, what's up?",
        "isQuestion": true,
        "isEndOfDialog": false,
        "buttons": [
          {
            "label": "There was this white bunny...",
            "goToDialog": 1,
            "size": 300
          }
        ]
      },
      {
        "id": "bunny_response",
        "text": "Whoa yeah, that hopper's been bouncing all over the place. I'm curious what he's up to. If you find out, come tell me!",
        "isQuestion": true,
        "isEndOfDialog": false,
        "buttons": [
          {
            "label": "I can't! The passage is blocked by a giant boulder!",
            "goToDialog": 2,
            "size": 300
          }
        ]
      },
      {
        "id": "boulder_problem",
        "text": "Oh, I see. That's nothing some deep riffs can't handle.",
        "isQuestion": true,
        "isEndOfDialog": false,
        "buttons": [
          {
            "label": "Some riffs?",
            "goToDialog": 3,
            "size": 300
          }
        ]
      },
      {
        "id": "riffs_explanation",
        "text": "Yeah! But my bass needs a new string first. Last gig was too groovy and the old one snapped. Think you can find one?",
        "isQuestion": false,
        "isEndOfDialog": true,
        "onNext": [
          {
            "type": "activateQuest",
            "params": {
              "questId": "deep_tunes"
            }
          }
        ]
      }
    ]
  },
  {
    "id": "bassimus_default",
    "name": "Default",
    "npcId": "bassimus",
    "questStepId": null,
    "dialogs": [
      {
        "id": "default_greeting",
        "text": "Hey, check out my bass! It's got that deep groove.",
        "isQuestion": false,
        "isEndOfDialog": true
      }
    ]
  },
  {
    "id": "bassimus_have_you_found_my_bass_string",
    "name": "Have you found my Bass String?",
    "npcId": "bassimus",
    "questStepId": "find_the_bass_string",
    "dialogs": [
      {
        "id": "searching_text",
        "text": "You're gonna love the sound of my beauty, but I need that new string first!",
        "isQuestion": false,
        "isEndOfDialog": true
      }
    ]
  },
  {
    "id": "bassimus_plays_riff",
    "name": "Plays Riff",
    "npcId": "bassimus",
    "questStepId": "return_to_bassimus",
    "dialogs": [
      {
        "id": "thanks_text",
        "text": "Whooaaa! Thanks, dude! Now let's see what this baby can do...",
        "isQuestion": false,
        "isEndOfDialog": true,
        "onNext": [
          {
            "type": "playSound",
            "params": {
              "audioPath": "assets/scene/audio/sfx/thunderous_riff.mp3",
              "volume": 0.8
            }
          },
          {
            "type": "playAnimation",
            "params": {
              "entityName": "Stone_Boulder",
              "animationName": "vibrate_and_fall"
            }
          },
          {
            "type": "setEntityInvisible",
            "params": {
              "entityName": "Stone_Boulder"
            }
          },
          {
            "type": "setEntityInvisible",
            "params": {
              "entityName": "NPC_Bunny_Cave"
            }
          },
          {
            "type": "setFlag",
            "params": {
              "flag": "boulder_moved",
              "value": true
            }
          }
        ]
      },
      {
        "id": "yeah_groove",
        "text": "YEAH! See? Nothing beats a deep groove!",
        "isQuestion": false,
        "isEndOfDialog": true
      }
    ]
  },
  {
    "id": "echo_meet_echo",
    "name": "Meet Echo",
    "npcId": "echo",
    "questStepId": "talk_to_echo",
    "dialogs": [
      {
        "id": "who_are_you",
        "text": "Whoa! Who are YOU?",
        "isQuestion": true,
        "isEndOfDialog": false,
        "buttons": [
          {
            "label": "Who are YOU?",
            "goToDialog": 1,
            "size": 300
          },
          {
            "label": "Obviously not you",
            "goToDialog": 2,
            "size": 300
          },
          {
            "label": "I don't know",
            "goToDialog": 3,
            "size": 300
          },
          {
            "label": "You, of course",
            "goToDialog": 4,
            "size": 300
          },
          {
            "label": "I am who I am",
            "goToDialog": 5,
            "size": 300
          }
        ]
      },
      {
        "id": "who_are_you_response",
        "text": "I am you, but the real question is... who are YOU?",
        "isQuestion": true,
        "isEndOfDialog": false,
        "buttons": [
          {
            "label": "Crystals!",
            "goToDialog": 6,
            "size": 300
          },
          {
            "label": "Crystals?",
            "goToDialog": 6,
            "size": 300
          },
          {
            "label": "...Crystals",
            "goToDialog": 6,
            "size": 300
          },
          {
            "label": "CRYSTALS!",
            "goToDialog": 6,
            "size": 300
          }
        ]
      },
      {
        "id": "not_you_response",
        "text": "Well, if I am you and you are me, then I'm sure we share the same desire...",
        "isQuestion": true,
        "isEndOfDialog": false,
        "buttons": [
          {
            "label": "Crystals!",
            "goToDialog": 6,
            "size": 300
          },
          {
            "label": "Crystals?",
            "goToDialog": 6,
            "size": 300
          },
          {
            "label": "...Crystals",
            "goToDialog": 6,
            "size": 300
          },
          {
            "label": "CRYSTALS!",
            "goToDialog": 6,
            "size": 300
          }
        ]
      },
      {
        "id": "dont_know_response",
        "text": "Well, if I am you and you are me, then I'm sure we share the same desire...",
        "isQuestion": true,
        "isEndOfDialog": false,
        "buttons": [
          {
            "label": "Crystals!",
            "goToDialog": 6,
            "size": 300
          },
          {
            "label": "Crystals?",
            "goToDialog": 6,
            "size": 300
          },
          {
            "label": "...Crystals",
            "goToDialog": 6,
            "size": 300
          },
          {
            "label": "CRYSTALS!",
            "goToDialog": 6,
            "size": 300
          }
        ]
      },
      {
        "id": "you_of_course_response",
        "text": "Well, if I am you and you are me, then I'm sure we share the same desire...",
        "isQuestion": true,
        "isEndOfDialog": false,
        "buttons": [
          {
            "label": "Crystals!",
            "goToDialog": 6,
            "size": 300
          },
          {
            "label": "Crystals?",
            "goToDialog": 6,
            "size": 300
          },
          {
            "label": "...Crystals",
            "goToDialog": 6,
            "size": 300
          },
          {
            "label": "CRYSTALS!",
            "goToDialog": 6,
            "size": 300
          }
        ]
      },
      {
        "id": "i_am_who_i_am_response",
        "text": "Well, if I am you and you are me, then I'm sure we share the same desire...",
        "isQuestion": true,
        "isEndOfDialog": false,
        "buttons": [
          {
            "label": "Crystals!",
            "goToDialog": 6,
            "size": 300
          },
          {
            "label": "Crystals?",
            "goToDialog": 6,
            "size": 300
          },
          {
            "label": "...Crystals",
            "goToDialog": 6,
            "size": 300
          },
          {
            "label": "CRYSTALS!",
            "goToDialog": 6,
            "size": 300
          }
        ]
      },
      {
        "id": "crystals_desire",
        "text": "YES! Let's get some crystals. Please grab a few from that grumpy keeper up there.",
        "isQuestion": false,
        "isEndOfDialog": true,
        "onNext": [
          {
            "type": "activateQuest",
            "params": {
              "questId": "mirror_self"
            }
          }
        ]
      }
    ]
  },
  {
    "id": "echo_echo_earthquake_reaction",
    "name": "Echo Earthquake Reaction",
    "npcId": "echo",
    "questStepId": null,
    "dialogs": [
      {
        "id": "earthquake_what",
        "text": "Whoaa what was that? What is happening?",
        "isQuestion": true,
        "isEndOfDialog": false,
        "buttons": [
          {
            "label": "Ok, heading back!",
            "goToDialog": 1,
            "size": 300
          }
        ]
      },
      {
        "id": "come_back",
        "text": "Come back!",
        "isQuestion": false,
        "isEndOfDialog": true,
        "onNext": [
          {
            "type": "setFlag",
            "params": {
              "flag": "echo_earthquake_reaction_shown",
              "value": true
            }
          }
        ]
      }
    ]
  },
  {
    "id": "echo_after_earthquake",
    "name": "After Earthquake",
    "npcId": "echo",
    "questStepId": "bring_crystals_to_echo",
    "dialogs": [
      {
        "id": "welp_happened",
        "text": "Oh... welp. That wasn't supposed to happen.",
        "isQuestion": true,
        "isEndOfDialog": false,
        "buttons": [
          {
            "label": "...",
            "goToDialog": 1,
            "size": 300
          }
        ]
      },
      {
        "id": "blocked_passage",
        "text": "The problem is... the earthquake blocked the passage.",
        "isQuestion": true,
        "isEndOfDialog": false,
        "buttons": [
          {
            "label": "What now?",
            "goToDialog": 2,
            "size": 300
          }
        ]
      },
      {
        "id": "mushroom_solution",
        "text": "I need some special mushrooms to clear this mess. Can you bring some from the world above?",
        "isQuestion": true,
        "isEndOfDialog": false,
        "buttons": [
          {
            "label": "Sure!",
            "goToDialog": 3,
            "size": 300
          }
        ]
      },
      {
        "id": "start_mushroom_run",
        "text": "Great! Get 10 mushrooms and bring them back to me.",
        "isQuestion": false,
        "isEndOfDialog": true,
        "onNext": [
          {
            "type": "activateQuest",
            "params": {
              "questId": "mushroom_run"
            }
          },
          {
            "type": "setFlag",
            "params": {
              "flag": "mushroom_quest_started",
              "value": true
            }
          }
        ]
      }
    ]
  },
  {
    "id": "echo_crystals_reminder",
    "name": "Crystals Reminder",
    "npcId": "echo",
    "questStepId": "get_the_crystals",
    "dialogs": [
      {
        "id": "lets_get_crystals",
        "text": "Let's get us some crystals!",
        "isQuestion": false,
        "isEndOfDialog": true
      }
    ]
  },
  {
    "id": "echo_mushroom_reminder",
    "name": "Mushroom Reminder",
    "npcId": "echo",
    "questStepId": "go_to_the_shrooms",
    "dialogs": [
      {
        "id": "get_10_mushrooms",
        "text": "Get 10 Mushrooms and bring them back to me.",
        "isQuestion": false,
        "isEndOfDialog": true
      }
    ]
  },
  {
    "id": "echo_mushroom_completion",
    "name": "Mushroom Completion",
    "npcId": "echo",
    "questStepId": null,
    "dialogs": [
      {
        "id": "enough_mushrooms",
        "text": "You have collected enough mushrooms! Bring them back to the cave.",
        "isQuestion": false,
        "isEndOfDialog": true,
        "onNext": [
          {
            "type": "setFlag",
            "params": {
              "flag": "mushroom_completion_shown",
              "value": true
            }
          }
        ]
      }
    ]
  },
  {
    "id": "echo_mushrooms_delivered",
    "name": "Mushrooms Delivered",
    "npcId": "echo",
    "questStepId": "bring_echo_mushrooms",
    "dialogs": [
      {
        "id": "perfect_placement",
        "text": "Perfect! Let me place these just right...",
        "isQuestion": false,
        "isEndOfDialog": true,
        "onNext": [
          {
            "type": "playAnimation",
            "params": {
              "entityName": "Debris_Pile",
              "animationName": "pulse_and_clear"
            }
          },
          {
            "type": "playAnimation",
            "params": {
              "entityName": "Debris_Pile_2",
              "animationName": "pulse_and_clear"
            }
          },
          {
            "type": "setFlag",
            "params": {
              "flag": "debris_pile_cleared",
              "value": true
            }
          },
          {
            "type": "setFlag",
            "params": {
              "flag": "debris_pile_2_cleared",
              "value": true
            }
          },
          {
            "type": "completeQuest",
            "params": {
              "questId": "mushroom_run"
            }
          },
          {
            "type": "activateItem",
            "params": {
              "itemId": "path_to_persephone"
            }
          },
          {
            "type": "setFlag",
            "params": {
              "flag": "mushrooms_delivered",
              "value": true
            }
          }
        ]
      },
      {
        "id": "say_hello_bunny",
        "text": "Say hello to the bunny for me!",
        "isQuestion": false,
        "isEndOfDialog": true
      }
    ]
  },
  {
    "id": "echo_confront_echo",
    "name": "Confront Echo",
    "npcId": "crystallia",
    "questStepId": null,
    "dialogs": [
      {
        "id": "what_have_you_done",
        "text": "What have you done? The crystals... they were mine!",
        "isQuestion": true,
        "isEndOfDialog": false,
        "buttons": [
          {
            "label": "I needed them for...",
            "goToDialog": 1,
            "size": 300
          }
        ]
      },
      {
        "id": "no_matter",
        "text": "No matter. The damage is done. Take your path and go.",
        "isQuestion": false,
        "isEndOfDialog": true,
        "onNext": [
          {
            "type": "setFlag",
            "params": {
              "flag": "echo_earthquake_reaction_shown",
              "value": true
            }
          }
        ]
      }
    ]
  },
  {
    "id": "echo_default",
    "name": "Default",
    "npcId": "echo",
    "questStepId": null,
    "dialogs": [
      {
        "id": "echo_introduction",
        "text": "I'm Echo. I see myself in everything around me.",
        "isQuestion": false,
        "isEndOfDialog": true
      }
    ]
  },
  {
    "id": "crystallia_warning",
    "name": "Warning",
    "npcId": "crystallia",
    "questStepId": null,
    "dialogs": [
      {
        "id": "dont_touch",
        "text": "Don't touch ANYTHING! Just move along!",
        "isQuestion": false,
        "isEndOfDialog": true
      }
    ]
  },
  {
    "id": "crystallia_touch_3_crystals",
    "name": "Touch 3 Crystals",
    "npcId": "crystallia",
    "questStepId": null,
    "dialogs": [
      {
        "id": "hey_stop",
        "text": "HEY! Didn't I tell you NOT to touch anything? Just keep moving!",
        "isQuestion": false,
        "isEndOfDialog": true
      }
    ]
  },
  {
    "id": "crystallia_touch_5_crystals",
    "name": "Touch 5 Crystals",
    "npcId": "crystallia",
    "questStepId": null,
    "dialogs": [
      {
        "id": "follow_bunny",
        "text": "Just follow the bunny!",
        "isQuestion": false,
        "isEndOfDialog": true
      }
    ]
  },
  {
    "id": "crystallia_touch_6_crystals",
    "name": "Touch 6 Crystals",
    "npcId": "crystallia",
    "questStepId": null,
    "dialogs": [
      {
        "id": "enough_out",
        "text": "Enough is ENOUGH! Out! Go HERE!",
        "isQuestion": false,
        "isEndOfDialog": true,
        "onNext": [
          {
            "type": "playAnimation",
            "params": {
              "entityName": "NPC_Crystallia",
              "animationName": "point_to_exit"
            }
          }
        ]
      }
    ]
  },
  {
    "id": "crystallia_second_visit_warning",
    "name": "Second Visit Warning",
    "npcId": "crystallia",
    "questStepId": null,
    "dialogs": [
      {
        "id": "you_again",
        "text": "You again? Remember don't touch ANYTHING! Just move along!",
        "isQuestion": false,
        "isEndOfDialog": true
      }
    ]
  },
  {
    "id": "crystallia_steal_3_crystals",
    "name": "Steal 3 Crystals",
    "npcId": "crystallia",
    "questStepId": null,
    "dialogs": [
      {
        "id": "hey_put_back",
        "text": "HEY! Didn't I tell you already NOT to touch those? Put them back!",
        "isQuestion": false,
        "isEndOfDialog": true
      }
    ]
  },
  {
    "id": "crystallia_steal_5_crystals",
    "name": "Steal 5 Crystals",
    "npcId": "crystallia",
    "questStepId": null,
    "dialogs": [
      {
        "id": "delicate_structure",
        "text": "This is a DELICATE structure!",
        "isQuestion": false,
        "isEndOfDialog": true
      }
    ]
  },
  {
    "id": "crystallia_steal_6_crystals",
    "name": "Steal 6 Crystals",
    "npcId": "crystallia",
    "questStepId": null,
    "dialogs": [
      {
        "id": "aaargh",
        "text": "Aaaargh!!",
        "isQuestion": false,
        "isEndOfDialog": true
      }
    ]
  },
  {
    "id": "crystallia_after_earthquake",
    "name": "After Earthquake",
    "npcId": "crystallia",
    "questStepId": null,
    "dialogs": [
      {
        "id": "move_on_clean",
        "text": "Just move on and let me clean this mess!",
        "isQuestion": false,
        "isEndOfDialog": true
      }
    ]
  },
  {
    "id": "crystallia_mushroom_quest_interaction",
    "name": "Mushroom Quest Interaction",
    "npcId": "crystallia",
    "questStepId": null,
    "dialogs": [
      {
        "id": "wondering_bunny",
        "text": "I am wondering where the bunny is...",
        "isQuestion": false,
        "isEndOfDialog": true
      }
    ]
  },
  {
    "id": "persephone_initial_meeting",
    "name": "Initial Meeting",
    "npcId": "persephone",
    "questStepId": "meet_persephone",
    "dialogs": [
      {
        "id": "why_here",
        "text": "Why... why am I here?",
        "isQuestion": true,
        "isEndOfDialog": false,
        "buttons": [
          {
            "label": "Are you okay?",
            "goToDialog": 1,
            "size": 300
          },
          {
            "label": "Have you seen the white bunny?",
            "goToDialog": 2,
            "size": 300
          }
        ]
      },
      {
        "id": "okay_response",
        "text": "I'm... stuck. Trapped here forever.",
        "isQuestion": true,
        "isEndOfDialog": false,
        "buttons": [
          {
            "label": "What happened?",
            "goToDialog": 3,
            "size": 300
          }
        ]
      },
      {
        "id": "bunny_response",
        "text": "I'm... stuck. Trapped here forever.",
        "isQuestion": true,
        "isEndOfDialog": false,
        "buttons": [
          {
            "label": "What happened?",
            "goToDialog": 3,
            "size": 300
          }
        ]
      },
      {
        "id": "pomegranate_story",
        "text": "I ate from the pomegranate... now I can never leave this place. It's the curse of the underworld.",
        "isQuestion": true,
        "isEndOfDialog": false,
        "buttons": [
          {
            "label": "There must be a way out.",
            "goToDialog": 4,
            "size": 300
          }
        ]
      },
      {
        "id": "portal_opening",
        "text": "For you, maybe... but not for me. The path ahead is yours to take. I belong here now.",
        "isQuestion": false,
        "isEndOfDialog": true,
        "onNext": [
          {
            "type": "activateQuest",
            "params": {
              "questId": "help_persephone"
            }
          },
          {
            "type": "setFlag",
            "params": {
              "flag": "persephone_conversation_complete",
              "value": true
            }
          }
        ]
      }
    ]
  },
  {
    "id": "persephone_seed_reminder",
    "name": "Seed Reminder",
    "npcId": "persephone",
    "questStepId": "activate_portal",
    "dialogs": [
      {
        "id": "use_seeds",
        "text": "Now use the pomegranate seeds to open the portal, but do not eat them.",
        "isQuestion": false,
        "isEndOfDialog": true
      }
    ]
  },
  {
    "id": "persephone_portal_convincing",
    "name": "Portal Convincing",
    "npcId": "persephone",
    "questStepId": "convince_persephone",
    "dialogs": [
      {
        "id": "portal_open",
        "text": "The portal is open.",
        "isQuestion": true,
        "isEndOfDialog": false,
        "buttons": [
          {
            "label": "Just follow me, it'll be fine!",
            "goToDialog": 1,
            "size": 300
          },
          {
            "label": "You don't have to stay here forever.",
            "goToDialog": 1,
            "size": 300
          },
          {
            "label": "I'm not leaving without you.",
            "goToDialog": 1,
            "size": 300
          }
        ]
      },
      {
        "id": "denial_1",
        "text": "You don't understand... it's not that simple.",
        "isQuestion": false,
        "isEndOfDialog": true
      }
    ]
  },
  {
    "id": "persephone_convinced_followup",
    "name": "Convinced Followup",
    "npcId": "persephone",
    "questStepId": null,
    "dialogs": [
      {
        "id": "grateful",
        "text": "I am so grateful that you are helping me. Thank you.",
        "isQuestion": false,
        "isEndOfDialog": true
      }
    ]
  },
  {
    "id": "persephone_default",
    "name": "Default",
    "npcId": "persephone",
    "dialogs": [
      {
        "id": "dialog_1760478727473",
        "text": "I am Persephone, queen of the 4 seasons!",
        "isQuestion": false,
        "isEndOfDialog": true
      }
    ]
  },
  {
    "id": "pumpking_guy_default",
    "name": "Default",
    "npcId": "pumpking_guy",
    "dialogs": [
      {
        "id": "dialog_1760664071661",
        "text": "Happy VibeHackathon!",
        "isQuestion": true,
        "isEndOfDialog": false,
        "buttons": [
          {
            "label": "Wohooo!",
            "goToDialog": 1,
            "size": 300
          }
        ]
      },
      {
        "id": "dialog_1760702317268",
        "text": "Spooky!",
        "isQuestion": false,
        "isEndOfDialog": true
      }
    ]
  },
  {
    "id": "pumpking_guy_quest_looking_for_cat",
    "name": "Quest: Looking for cat",
    "dialogs": [
      {
        "id": "dialog_1760884792209",
        "text": "Mew must be here somewhere!",
        "isQuestion": false,
        "isEndOfDialog": true
      }
    ],
    "npcId": "pumpking_guy",
    "questStepId": "find_cat_mew"
  },
  {
    "id": "pumpking_guy_quest_return_cat_mew_to_pumpkin_guy",
    "name": "Quest: Return Cat Mew To Pumpkin Guy",
    "dialogs": [
      {
        "id": "dialog_1760884967263",
        "text": "There you are Mew!",
        "isQuestion": false,
        "isEndOfDialog": false
      },
      {
        "id": "dialog_1760885025799",
        "text": " Thank you so much dear traveller! Let me give you this key!",
        "isQuestion": false,
        "isEndOfDialog": true
      }
    ],
    "npcId": "pumpking_guy",
    "questStepId": "bring_mew_back_to_pumpkin_guy"
  },
  {
    "id": "pumpking_guy_i_lost_my_cat_mew",
    "name": "I lost my cat Mew",
    "dialogs": [
      {
        "id": "dialog_1760887925560",
        "text": "Hey, Have you seen my cat Mew?",
        "isQuestion": true,
        "isEndOfDialog": false,
        "buttons": [
          {
            "label": "No",
            "goToDialog": 1,
            "size": 300
          }
        ]
      },
      {
        "id": "dialog_1760887975263",
        "text": "If you see him, let me know!",
        "isQuestion": false,
        "isEndOfDialog": true
      }
    ],
    "npcId": "pumpking_guy",
    "questStepId": "talk_to_pumpkin_guy"
  }
];

export const EMBEDDED_ENTITYLINKS = {
  "512": {
    "position": {
      "x": -19.75,
      "y": 12,
      "z": -16.25
    },
    "parent": 518,
    "name": "Bunny Trigger Area_2",
    "questEntityId": "debug_test"
  },
  "513": {
    "position": {
      "x": -19.25,
      "y": 36.5,
      "z": -15.5
    },
    "parent": 523,
    "name": "NPC Crystallia",
    "questEntityId": "bass_string"
  },
  "514": {
    "position": {
      "x": 0,
      "y": 0,
      "z": 0
    },
    "parent": 523,
    "name": "Cave",
    "questEntityId": "crystal_3"
  },
  "515": {
    "position": {
      "x": 0,
      "y": 0,
      "z": 0
    },
    "parent": 518,
    "name": "Stage",
    "questEntityId": "crystal_4"
  },
  "516": {
    "position": {
      "x": -0.9899855852127075,
      "y": 44.20458221435547,
      "z": -4.901730537414551
    },
    "parent": 523,
    "name": "Portal_to_Main_Stage",
    "questEntityId": "crystal_5"
  },
  "517": {
    "position": {
      "x": -8.75,
      "y": 43.5,
      "z": -5
    },
    "parent": 523,
    "name": "Stone_Boulder",
    "questEntityId": "crystal_6"
  },
  "518": {
    "position": {
      "x": 0,
      "y": 0,
      "z": 0
    },
    "parent": 0,
    "name": "Location Stage",
    "questEntityId": "crystal_7"
  },
  "519": {
    "position": {
      "x": -3.5,
      "y": 1.5,
      "z": -7.25
    },
    "parent": 523,
    "name": "demo-material.gltf",
    "questEntityId": "crystal_8"
  },
  "520": {
    "position": {
      "x": -3.5,
      "y": 1.5,
      "z": -11.25
    },
    "parent": 523,
    "name": "demo-material.gltf_2",
    "questEntityId": "pomegranate_seed"
  },
  "521": {
    "position": {
      "x": -2.25,
      "y": 2,
      "z": -30.75
    },
    "parent": 523,
    "name": "Portal to Stage",
    "questEntityId": "pomegranate_seed"
  },
  "522": {
    "position": {
      "x": -4.25,
      "y": 2,
      "z": -30.75
    },
    "parent": 518,
    "name": "Portal to Cave",
    "questEntityId": "portal_to_abyss"
  },
  "523": {
    "position": {
      "x": 0,
      "y": 0,
      "z": 0
    },
    "parent": 0,
    "name": "Location Cave",
    "questEntityId": "pomegranate_seed_1"
  },
  "524": {
    "position": {
      "x": -18.25,
      "y": 19.5,
      "z": -16.5
    },
    "parent": 523,
    "name": "NPC Echo",
    "questEntityId": "pomegranate_seed_3"
  },
  "525": {
    "position": {
      "x": -8.25,
      "y": 42.75,
      "z": -7
    },
    "parent": 523,
    "name": "NPC_Bunny_Cave",
    "questEntityId": "pomegranate_seed_4"
  },
  "526": {
    "position": {
      "x": -5.5,
      "y": 0.5,
      "z": -16
    },
    "parent": 523,
    "name": "NPC Persephone",
    "questEntityId": "vessel_1"
  },
  "527": {
    "position": {
      "x": -20.75,
      "y": 9,
      "z": -7.5
    },
    "parent": 518,
    "name": "NPC Bunny",
    "questEntityId": "vessel_2"
  },
  "528": {
    "position": {
      "x": 0,
      "y": 0,
      "z": 0
    },
    "parent": 0,
    "name": "Location Abyss",
    "questEntityId": "vessel_3"
  },
  "529": {
    "position": {
      "x": -12.75,
      "y": 2.75,
      "z": -5.75
    },
    "parent": 518,
    "name": "Bunny Trigger Area",
    "questEntityId": "vessel_4"
  },
  "530": {
    "position": {
      "x": 14,
      "y": 0,
      "z": 11
    },
    "parent": 528,
    "name": "Spider Net 01",
    "questEntityId": null
  },
  "531": {
    "position": {
      "x": -15.5,
      "y": 39.5,
      "z": -29.25
    },
    "parent": 523,
    "name": "NPC Bassimus",
    "questEntityId": "vessel_5"
  },
  "532": {
    "position": {
      "x": -24.25,
      "y": 42.25,
      "z": -27
    },
    "parent": 523,
    "name": "Item Bass String",
    "questEntityId": "special_mushroom"
  },
  "533": {
    "position": {
      "x": -20.25,
      "y": 35.25,
      "z": -12
    },
    "parent": 523,
    "name": "Stone_Boulder_2",
    "questEntityId": "special_mushroom_1"
  },
  "534": {
    "position": {
      "x": -15.75,
      "y": 36,
      "z": -16.5
    },
    "parent": 523,
    "name": "Item_Crystal_1",
    "questEntityId": "special_mushroom_2"
  },
  "535": {
    "position": {
      "x": -20.5,
      "y": 38.25,
      "z": -14.75
    },
    "parent": 523,
    "name": "Debris_Pile_2",
    "questEntityId": "special_mushroom_3"
  },
  "536": {
    "position": {
      "x": 14,
      "y": 3,
      "z": 10.75
    },
    "parent": 528,
    "name": "Spider Net 01_2",
    "questEntityId": null
  },
  "537": {
    "position": {
      "x": 11,
      "y": 0,
      "z": 13.75
    },
    "parent": 528,
    "name": "Grave 15",
    "questEntityId": null
  },
  "538": {
    "position": {
      "x": -25.75,
      "y": 20.25,
      "z": -21
    },
    "parent": 523,
    "name": "Small Stone Stair",
    "questEntityId": "boulder_blocking"
  },
  "539": {
    "position": {
      "x": 13.5,
      "y": 0,
      "z": 14.75
    },
    "parent": 528,
    "name": "Grave 15_2",
    "questEntityId": null
  },
  "540": {
    "position": {
      "x": 15.75,
      "y": 0,
      "z": 13.25
    },
    "parent": 528,
    "name": "Grave 15_2_3",
    "questEntityId": null
  },
  "541": {
    "position": {
      "x": -21.75,
      "y": 36,
      "z": -24.75
    },
    "parent": 523,
    "name": "Item_Crystal_2",
    "questEntityId": "debris_pile"
  },
  "542": {
    "position": {
      "x": -12.75,
      "y": 36,
      "z": -17.75
    },
    "parent": 523,
    "name": "Item_Crystal_3",
    "questEntityId": "debris_pile_1"
  },
  "543": {
    "position": {
      "x": -19.5,
      "y": 36,
      "z": -12.25
    },
    "parent": 523,
    "name": "Item_Crystal_4",
    "questEntityId": "stage_glb"
  },
  "544": {
    "position": {
      "x": -17.75,
      "y": 36,
      "z": -20.25
    },
    "parent": 523,
    "name": "Item_Crystal_5",
    "questEntityId": "boulder_unblocking"
  },
  "545": {
    "position": {
      "x": -13.75,
      "y": 36,
      "z": -9.5
    },
    "parent": 523,
    "name": "Item_Crystal_6",
    "questEntityId": "special_mushroom_4"
  },
  "546": {
    "position": {
      "x": -16.5,
      "y": 36,
      "z": -13.25
    },
    "parent": 523,
    "name": "Item_Crystal_7",
    "questEntityId": "special_mushroom_5"
  },
  "547": {
    "position": {
      "x": -21.75,
      "y": 36,
      "z": -20.25
    },
    "parent": 523,
    "name": "Item_Crystal_8",
    "questEntityId": "special_mushroom_6"
  },
  "548": {
    "position": {
      "x": -13.5,
      "y": 36,
      "z": -20
    },
    "parent": 523,
    "name": "Item_Crystal_9",
    "questEntityId": "special_mushroom_7"
  },
  "549": {
    "position": {
      "x": -17,
      "y": 36,
      "z": -23.25
    },
    "parent": 523,
    "name": "Item_Crystal_10",
    "questEntityId": "new_portal_4"
  },
  "550": {
    "position": {
      "x": 13.722099304199219,
      "y": 0,
      "z": 10.382861137390137
    },
    "parent": 528,
    "name": "Skull&Candles ",
    "questEntityId": null
  },
  "551": {
    "position": {
      "x": -24.75,
      "y": 0,
      "z": -27.25
    },
    "parent": 518,
    "name": "Item_Special_Mushroom_12",
    "questEntityId": "new_portal_5"
  },
  "552": {
    "position": {
      "x": -24.75,
      "y": 0,
      "z": -29.321809768676758
    },
    "parent": 518,
    "name": "Item_Special_Mushroom_1",
    "questEntityId": "new_portal_3"
  },
  "553": {
    "position": {
      "x": -24.75,
      "y": 0,
      "z": -25.10150909423828
    },
    "parent": 518,
    "name": "Item_Special_Mushroom_2",
    "questEntityId": "new_portal_2"
  },
  "554": {
    "position": {
      "x": -26.53130340576172,
      "y": 0,
      "z": -25.323139190673828
    },
    "parent": 518,
    "name": "Item_Special_Mushroom_3",
    "questEntityId": "new_portal_1"
  },
  "555": {
    "position": {
      "x": -26.53130340576172,
      "y": 0,
      "z": -27.23270034790039
    },
    "parent": 518,
    "name": "Item_Special_Mushroom_4",
    "questEntityId": "portal_to_main_stage"
  },
  "556": {
    "position": {
      "x": -26.53130340576172,
      "y": 0,
      "z": -29.401016235351562
    },
    "parent": 518,
    "name": "Item_Special_Mushroom_5",
    "questEntityId": "bunny_cave"
  },
  "557": {
    "position": {
      "x": -28.697528839111328,
      "y": 0,
      "z": -29.401016235351562
    },
    "parent": 518,
    "name": "Item_Special_Mushroom_6",
    "questEntityId": "portal_to_cave"
  },
  "558": {
    "position": {
      "x": -28.697528839111328,
      "y": 0,
      "z": -27.152240753173828
    },
    "parent": 518,
    "name": "Item_Special_Mushroom_7",
    "questEntityId": "echo"
  },
  "559": {
    "position": {
      "x": -28.697528839111328,
      "y": 0,
      "z": -25.31105613708496
    },
    "parent": 518,
    "name": "Item_Special_Mushroom_8",
    "questEntityId": "bassimus"
  },
  "560": {
    "position": {
      "x": -28.697528839111328,
      "y": 0,
      "z": -23.949600219726562
    },
    "parent": 518,
    "name": "Item_Special_Mushroom_9",
    "questEntityId": "crystallia"
  },
  "561": {
    "position": {
      "x": -21.849367141723633,
      "y": 11.75,
      "z": -15.949600219726562
    },
    "parent": 518,
    "name": "Item_Special_Mushroom_10",
    "questEntityId": "cave_glb"
  },
  "562": {
    "position": {
      "x": -24.81660270690918,
      "y": 0,
      "z": -23.949600219726562
    },
    "parent": 518,
    "name": "Item_Special_Mushroom_11",
    "questEntityId": "special_mushroom_11"
  },
  "563": {
    "position": {
      "x": -19.650245666503906,
      "y": 3.2275712490081787,
      "z": -15.624879837036133
    },
    "parent": 523,
    "name": "Item_Pomegranate_Seed_1",
    "questEntityId": "abyss"
  },
  "564": {
    "position": {
      "x": -19.650245666503906,
      "y": 3.2275712490081787,
      "z": -16.624879837036133
    },
    "parent": 523,
    "name": "Item_Pomegranate_Seed_2",
    "questEntityId": "mycelium_caves"
  },
  "565": {
    "position": {
      "x": -19.650245666503906,
      "y": 3.2275712490081787,
      "z": -17.874879837036133
    },
    "parent": 523,
    "name": "Item_Pomegranate_Seed_3",
    "questEntityId": "main_stage"
  },
  "566": {
    "position": {
      "x": -19.650245666503906,
      "y": 3.2275712490081787,
      "z": -17.374879837036133
    },
    "parent": 523,
    "name": "Item_Pomegranate_Seed_4",
    "questEntityId": "new_portal"
  },
  "567": {
    "position": {
      "x": -19.650245666503906,
      "y": 3.2275712490081787,
      "z": -18.374879837036133
    },
    "parent": 523,
    "name": "Item_Pomegranate_Seed_5",
    "questEntityId": "persephone"
  },
  "568": {
    "position": {
      "x": -25.75,
      "y": 2.25,
      "z": -15.75
    },
    "parent": 523,
    "name": "Portal_to_Abyss",
    "questEntityId": "crystal"
  },
  "569": {
    "position": {
      "x": -24.75,
      "y": 18.5,
      "z": -10.5
    },
    "parent": 523,
    "name": "Debris_Pile",
    "questEntityId": "crystal_9"
  },
  "570": {
    "position": {
      "x": -27,
      "y": 1.5,
      "z": -17.099843978881836
    },
    "parent": 523,
    "name": "Item_Vessel_1",
    "questEntityId": "crystal_2"
  },
  "571": {
    "position": {
      "x": 6.75,
      "y": 0,
      "z": 7.25
    },
    "parent": 528,
    "name": "Cat",
    "questEntityId": "cat"
  },
  "572": {
    "position": {
      "x": 14.5,
      "y": 0,
      "z": 18
    },
    "parent": 528,
    "name": " Ironf Fence 3",
    "questEntityId": null
  },
  "573": {
    "position": {
      "x": -27,
      "y": 1.25,
      "z": -15.349843978881836
    },
    "parent": 523,
    "name": "Item_Vessel_2",
    "questEntityId": "crystal_10"
  },
  "574": {
    "position": {
      "x": -25.5,
      "y": 1.25,
      "z": -14.349843978881836
    },
    "parent": 523,
    "name": "Item_Vessel_3",
    "questEntityId": "special_mushroom_8"
  },
  "575": {
    "position": {
      "x": -23.75,
      "y": 1,
      "z": -15.599843978881836
    },
    "parent": 523,
    "name": "Item_Vessel_4",
    "questEntityId": "special_mushroom_9"
  },
  "576": {
    "position": {
      "x": -25,
      "y": 1.5,
      "z": -17.349843978881836
    },
    "parent": 523,
    "name": "Item_Vessel_5",
    "questEntityId": "special_mushroom_10"
  },
  "577": {
    "position": {
      "x": 19,
      "y": 0,
      "z": 13
    },
    "parent": 528,
    "name": "Iron Fence 2",
    "questEntityId": null
  },
  "578": {
    "position": {
      "x": 16.5,
      "y": 0,
      "z": 16.25
    },
    "parent": 528,
    "name": "Iron Door 01",
    "questEntityId": null
  },
  "579": {
    "position": {
      "x": 11.5,
      "y": 0.9969428777694702,
      "z": 11.569402694702148
    },
    "parent": 528,
    "name": "PUMPKIN GUY",
    "questEntityId": "pumpking_guy"
  },
  "580": {
    "position": {
      "x": 14,
      "y": 0,
      "z": 10.75
    },
    "parent": 528,
    "name": "Tree ",
    "questEntityId": null
  },
  "581": {
    "position": {
      "x": 0,
      "y": 0,
      "z": 0
    },
    "parent": 528,
    "name": "Ground",
    "questEntityId": null
  },
  "582": {
    "position": {
      "x": 8,
      "y": 0,
      "z": 24
    },
    "parent": 581,
    "name": "Tile 1",
    "questEntityId": null
  },
  "583": {
    "position": {
      "x": 24,
      "y": 0,
      "z": 24
    },
    "parent": 581,
    "name": "Tile 2",
    "questEntityId": null
  },
  "584": {
    "position": {
      "x": 8,
      "y": 0,
      "z": 8
    },
    "parent": 581,
    "name": "Tile 3",
    "questEntityId": null
  },
  "585": {
    "position": {
      "x": 24,
      "y": 0,
      "z": 8
    },
    "parent": 581,
    "name": "Tile 4",
    "questEntityId": null
  },
  "586": {
    "position": {
      "x": 9,
      "y": 0,
      "z": 13.75
    },
    "parent": 528,
    "name": "Lamp 01",
    "questEntityId": null
  },
  "587": {
    "position": {
      "x": 12,
      "y": 0,
      "z": 12
    },
    "parent": 528,
    "name": "Small Green Grass Mound",
    "questEntityId": null
  },
  "588": {
    "position": {
      "x": 11,
      "y": 0,
      "z": 12.5
    },
    "parent": 528,
    "name": "Brown Mountain",
    "questEntityId": null
  },
  "589": {
    "position": {
      "x": -3.6739405577555036e-16,
      "y": 0,
      "z": -3
    },
    "parent": 518,
    "name": "stage-2-facepreview.glb",
    "questEntityId": "stage_2_face_previes"
  },
  "590": {
    "position": {
      "x": 10,
      "y": 0,
      "z": 1.25
    },
    "parent": 528,
    "name": "Wooden Door",
    "questEntityId": "new_portal_xd_1"
  }
};

