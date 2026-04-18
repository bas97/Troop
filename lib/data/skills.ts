import type { Skill, Equipment } from '@/types'

export const EQUIPMENT: Equipment[] = [
  { id: 'pullup_bar',       name: 'Pull-up bar',                        category: 'bars' },
  { id: 'parallel_bars',    name: 'Parallel bars / Dip bars',           category: 'bars' },
  { id: 'rings',            name: 'Gymnastic rings',                    category: 'suspended' },
  { id: 'parallettes',      name: 'Parallettes',                        category: 'static' },
  { id: 'wall',             name: 'Wall space',                         category: 'static' },
  { id: 'bench',            name: 'Bench',                              category: 'static' },
  { id: 'resistance_bands', name: 'Resistance bands',                   category: 'static' },
  { id: 'weights',          name: 'Weights (dumbbell / kettlebell)',     category: 'weighted' },
  { id: 'floor',            name: 'Floor',                              category: 'floor' },
  { id: 'foot_anchor',      name: 'Foot anchor (for Nordics)',          category: 'static' },
]

export const SKILLS: Skill[] = [
  { id: 'planche',      name: 'Planche',            family: 'pushing', type: 'static',  recommended_frequency: 4, description: 'Straight-arm pushing hold with body parallel to ground' },
  { id: 'hspu',         name: 'Handstand Push-up',  family: 'pushing', type: 'dynamic', recommended_frequency: 3, description: 'Overhead pressing skill from a handstand position' },
  { id: 'front_lever',  name: 'Front Lever',        family: 'pulling', type: 'static',  recommended_frequency: 4, description: 'Straight-arm pulling hold with body horizontal' },
  { id: 'back_lever',   name: 'Back Lever',         family: 'pulling', type: 'static',  recommended_frequency: 4, description: 'Inverted horizontal hold with body parallel to ground' },
  { id: 'muscle_up',    name: 'Muscle-Up',          family: 'pulling', type: 'dynamic', recommended_frequency: 3, description: 'Explosive transition from pull-up to dip above the bar or rings' },
  { id: 'one_arm_pu',   name: 'One-Arm Pull-Up',    family: 'pulling', type: 'dynamic', recommended_frequency: 2, description: 'Single-arm pull-up to full elbow extension' },
  { id: 'handstand',    name: 'Handstand',          family: 'balance', type: 'static',  recommended_frequency: 6, description: 'Inverted balance on two hands — the foundation of all pushing skills' },
  { id: 'l_sit',        name: 'L-Sit / V-Sit',      family: 'balance', type: 'static',  recommended_frequency: 3, description: 'Compression hold with legs parallel (or above) to ground' },
  { id: 'human_flag',   name: 'Human Flag',         family: 'balance', type: 'static',  recommended_frequency: 2, description: 'Horizontal hold on a vertical pole using lateral force' },
  { id: 'pistol_squat', name: 'Pistol Squat',       family: 'legs',    type: 'dynamic', recommended_frequency: 3, description: 'Single-leg squat to full depth with opposite leg extended' },
  { id: 'shrimp_squat', name: 'Shrimp Squat',       family: 'legs',    type: 'dynamic', recommended_frequency: 3, description: 'Single-leg squat with rear foot elevated behind the body' },
  { id: 'nordic_curl',  name: 'Nordic Curl',        family: 'legs',    type: 'dynamic', recommended_frequency: 2, description: 'Eccentric hamstring exercise anchoring feet and lowering body to ground' },
]

export const SKILL_ICONS: Record<string, string> = {
  planche:      '⚖',
  hspu:         '🤸',
  front_lever:  '🏋',
  back_lever:   '🔄',
  muscle_up:    '💪',
  one_arm_pu:   '✊',
  handstand:    '🙆',
  l_sit:        '🪑',
  human_flag:   '🚩',
  pistol_squat: '🦵',
  shrimp_squat: '🦐',
  nordic_curl:  '🦵',
}

export const EQUIPMENT_PROFILES_PRESETS = {
  full_gym: {
    name: 'Full gym',
    equipment_ids: ['pullup_bar','parallel_bars','rings','parallettes','wall','bench','resistance_bands','weights','floor'],
  },
  park: {
    name: 'Park',
    equipment_ids: ['pullup_bar','parallel_bars','wall','floor'],
  },
  home_rings: {
    name: 'Home + rings',
    equipment_ids: ['pullup_bar','rings','wall','floor','resistance_bands'],
  },
  home_minimal: {
    name: 'Home minimal',
    equipment_ids: ['pullup_bar','wall','floor'],
  },
  travel: {
    name: 'Travel / no equipment',
    equipment_ids: ['floor','wall'],
  },
}
