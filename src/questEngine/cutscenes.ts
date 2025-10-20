// import { EntityNames } from '../../assets/scene/entity-names'
// import { GameEngine } from './GameEngine'
// import * as utils from '@dcl-sdk/utils'
// import { VirtualCamera } from '@dcl/sdk/ecs'

// /**
//  * Cutscene definitions and logic
//  * Contains cinematic sequences that can be triggered by game events
//  */

// export interface CutsceneAction {
//   type: string
//   payload?: any
//   delay?: number // Delay in milliseconds before executing this action
// }

// export interface Cutscene {
//   id: string
//   name: string
//   actions: CutsceneAction[]
// }

// /**
//  * Bunny greeting cutscene - triggered when player enters bunny trigger area
//  * Only plays once per session (Scene 1: Main Stage)
//  */
// export const bunnyGreetingCutscene: Cutscene = {
//   id: 'bunny_greeting',
//   name: 'Bunny Greeting Sequence',
//   actions: [
//     // Start the bunny's greeting dialogue
//     {
//       type: 'start_dialogue',
//       payload: {
//         npcId: 'bunny',
//         sequenceId: 'greeting'
//       }
//     },
//     // Create virtual camera looking at bunny
//     {
//       type: 'create_virtual_camera',
//       payload: {
//         cameraId: 'bunny_look_at',
//         position: { x: 0, y: 2, z: 5 },
//         lookAtEntity: EntityNames.NPC_Bunny,
//         transition: {
//           transitionMode: VirtualCamera.Transition.Time(2)
//         }
//       }
//     },
//     // Transition to the camera
//     {
//       type: 'transition_camera',
//       payload: { cameraId: 'bunny_look_at' }
//     },
//     // Wait 0.5 seconds then play waving animation
//     {
//       type: 'play_animation',
//       payload: {
//         entityName: EntityNames.NPC_Bunny,
//         animationName: 'Waving',
//         loop: false,
//         resetCursor: true
//       },
//       delay: 500
//     },
//     // After 2 seconds, play joyful jump animation
//     {
//       type: 'play_animation',
//       payload: {
//         entityName: EntityNames.NPC_Bunny,
//         animationName: 'Joyful Jump',
//         loop: false,
//         resetCursor: true
//       },
//       delay: 2500 // 500ms + 2000ms from previous delay
//     },
//     // After jump animation, make bunny invisible
//     {
//       type: 'set_entity_invisible',
//       payload: {
//         entityName: EntityNames.NPC_Bunny
//       },
//       delay: 3500 // 500ms + 2000ms + 1000ms (jump animation duration)
//     },
//     // Reset camera while bunny is invisible
//     {
//       type: 'reset_camera',
//       delay: 3500 // Same time as making invisible
//     },
//     // Move bunny to new position while invisible
//     {
//       type: 'move_entity',
//       payload: {
//         entityName: EntityNames.NPC_Bunny,
//         position: { x: -17.6, y: 11.75, z: -16 }
//       },
//       delay: 4500 // 500ms + 2000ms + 1500ms (after invisible + camera reset)
//     },
//     // Make bunny visible again at new position
//     {
//       type: 'set_entity_visible',
//       payload: {
//         entityName: EntityNames.NPC_Bunny
//       },
//       delay: 500 // After move is complete
//     }
//   ]
// }

// /**
//  * Plays a cutscene by executing its actions in sequence
//  */
// export function playCutscene(gameEngine: GameEngine, cutscene: Cutscene): void {
//   console.log(`🎬 Starting cutscene: ${cutscene.name}`)

//   let totalDelay = 0

//   for (const action of cutscene.actions) {
//     const delay = action.delay || 0
//     totalDelay += delay

//     utils.timers.setTimeout(() => {
//       console.log(`🎬 Executing cutscene action: ${action.type}`)
//       gameEngine.executeAction(action)
//     }, totalDelay)
//   }
// }

// /**
//  * Available cutscenes registry
//  */
// export const cutscenes = {
//   bunny_greeting: bunnyGreetingCutscene
// }

// /**
//  * Helper function to play a cutscene by ID
//  */
// export function playCutsceneById(gameEngine: GameEngine, cutsceneId: string): void {
//   const cutscene = cutscenes[cutsceneId as keyof typeof cutscenes]
//   if (cutscene) {
//     playCutscene(gameEngine, cutscene)
//   } else {
//     console.error(`🎬 Cutscene not found: ${cutsceneId}`)
//   }
// }
