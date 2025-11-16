// ChefIQ Appliance Types and Cooking Methods
import { Step } from './recipe';

export interface CookingParameter {
  name: string;
  type: 'number' | 'string' | 'boolean' | 'select';
  defaultValue: any;
  unit?: string;
  min?: number;
  max?: number;
  options?: string[];
  required: boolean;
}

export interface CookingMethod {
  id: string;
  name: string;
  description: string;
  parameters: CookingParameter[];
  estimatedTime?: number; // in minutes
}

export interface ChefIQAppliance {
  category_id: string;
  name: string;
  thing_category_name: string;
  short_code: string;
  type: string;
  icon: string;
  picture: string;
  order: number;
  supports_probe?: boolean;
  cookingMethods: CookingMethod[];
}

export interface CookingAction {
  id: string;
  applianceId: string;
  methodId: string;
  methodName: string;
  parameters: { [key: string]: any };
  stepIndex?: number; // for step-level actions
  sectionIndex?: number; // for section-level actions
  estimatedTime?: number;
}

export interface StepSection {
  title: string;
  steps: Step[];
  cookingAction?: CookingAction;
}

// ChefIQ Appliances Database
export const CHEFIQ_APPLIANCES: ChefIQAppliance[] = [
  {
    category_id: 'c8ff3aef-3de6-4a74-bba6-03e943b2762c',
    name: 'iQ Cooker',
    thing_category_name: 'cooker',
    short_code: 'SC',
    type: 'appliance',
    icon: 'https://assets.chefiq.com/icons/devices/iQCooker.png',
    picture: 'https://chefiq-images.s3.amazonaws.com/multi_cooker.jpg',
    order: 1,
    cookingMethods: [
      {
        id: 'pressure_cook',
        name: 'Pressure Cook',
        description: 'High pressure cooking for faster results',
        parameters: [
          {
            name: 'pressure',
            type: 'select',
            defaultValue: 'High',
            options: ['High', 'Low'],
            required: true
          },
          {
            name: 'time',
            type: 'number',
            defaultValue: 10,
            unit: 'minutes',
            min: 1,
            max: 240,
            required: true
          },
          {
            name: 'naturalRelease',
            type: 'boolean',
            defaultValue: true,
            required: false
          }
        ],
        estimatedTime: 25 // includes pressure build time
      },
      {
        id: 'slow_cook',
        name: 'Slow Cook',
        description: 'Low and slow cooking for tender results',
        parameters: [
          {
            name: 'temperature',
            type: 'select',
            defaultValue: 'Low',
            options: ['Low', 'Medium', 'High'],
            required: true
          },
          {
            name: 'time',
            type: 'number',
            defaultValue: 240,
            unit: 'minutes',
            min: 30,
            max: 720,
            required: true
          }
        ]
      },
      {
        id: 'saute',
        name: 'Sauté',
        description: 'High heat cooking for browning and searing',
        parameters: [
          {
            name: 'temperature',
            type: 'select',
            defaultValue: 'Medium',
            options: ['Low', 'Medium', 'High'],
            required: true
          },
          {
            name: 'time',
            type: 'number',
            defaultValue: 5,
            unit: 'minutes',
            min: 1,
            max: 60,
            required: false
          }
        ]
      },
      {
        id: 'steam',
        name: 'Steam',
        description: 'Steam cooking for healthy preparations',
        parameters: [
          {
            name: 'time',
            type: 'number',
            defaultValue: 15,
            unit: 'minutes',
            min: 1,
            max: 60,
            required: true
          }
        ]
      },
      {
        id: 'rice',
        name: 'Rice/Grain',
        description: 'Perfect rice and grain cooking',
        parameters: [
          {
            name: 'grainType',
            type: 'select',
            defaultValue: 'White Rice',
            options: ['White Rice', 'Brown Rice', 'Wild Rice', 'Quinoa', 'Barley'],
            required: true
          },
          {
            name: 'cups',
            type: 'number',
            defaultValue: 2,
            unit: 'cups',
            min: 1,
            max: 8,
            required: true
          }
        ]
      }
    ]
  },
  {
    category_id: 'a542fa25-5053-4946-8b77-e358467baa0f',
    name: 'iQ Sense',
    thing_category_name: 'sense',
    short_code: 'CQ60',
    type: 'appliance',
    icon: 'https://firebasestorage.googleapis.com/v0/b/reciep-studio.firebasestorage.app/o/thermometer.png?alt=media&token=9407d9eb-e025-471b-8567-85a96e5fcf57',
    picture: 'https://firebasestorage.googleapis.com/v0/b/reciep-studio.firebasestorage.app/o/CQ60-1C-HUB-overhead.png?alt=media&token=4e7172cb-636c-4d7d-9b03-ae8eea783059',
    order: 2,
    supports_probe: true,
    cookingMethods: [
      {
        id: 'monitor_temp',
        name: 'Monitor Temperature',
        description: 'Monitor internal temperature with probe',
        parameters: [
          {
            name: 'target_probe_temp',
            type: 'number',
            defaultValue: 145,
            unit: '°F',
            min: 100,
            max: 300,
            required: true
          },
          {
            name: 'remove_probe_temp',
            type: 'number',
            defaultValue: 140,
            unit: '°F',
            min: 100,
            max: 300,
            required: false
          }
        ]
      }
    ]
  },
  {
    category_id: '4a3cd4f1-839b-4f45-80ea-08f594ff74c3',
    name: 'iQ MiniOven',
    thing_category_name: 'oven',
    short_code: 'SO',
    type: 'appliance',
    icon: 'https://assets.chefiq.com/icons/devices/iQMiniOven.png',
    picture: 'https://assets.chefiq.com/images/devices/iq-mini-oven-CQ50/cover-photo.png',
    order: 3,
    supports_probe: true,
    cookingMethods: [
      {
        id: 'bake',
        name: 'Bake',
        description: 'Traditional baking with even heat distribution',
        parameters: [
          {
            name: 'temperature',
            type: 'number',
            defaultValue: 350,
            unit: '°F',
            min: 150,
            max: 450,
            required: true
          },
          {
            name: 'time',
            type: 'number',
            defaultValue: 25,
            unit: 'minutes',
            min: 1,
            max: 120,
            required: true
          },
          {
            name: 'convection',
            type: 'boolean',
            defaultValue: false,
            required: false
          }
        ]
      },
      {
        id: 'broil',
        name: 'Broil',
        description: 'High heat from above for browning and crisping',
        parameters: [
          {
            name: 'temperature',
            type: 'select',
            defaultValue: 'High',
            options: ['Low', 'High'],
            required: true
          },
          {
            name: 'time',
            type: 'number',
            defaultValue: 5,
            unit: 'minutes',
            min: 1,
            max: 30,
            required: true
          }
        ]
      },
      {
        id: 'toast',
        name: 'Toast',
        description: 'Perfect toasting for bread and pastries',
        parameters: [
          {
            name: 'darkness',
            type: 'select',
            defaultValue: 'Medium',
            options: ['Light', 'Medium', 'Dark'],
            required: true
          },
          {
            name: 'slices',
            type: 'number',
            defaultValue: 2,
            unit: 'slices',
            min: 1,
            max: 6,
            required: true
          }
        ]
      },
      {
        id: 'air_fry',
        name: 'Air Fry',
        description: 'Crispy results with circulating hot air',
        parameters: [
          {
            name: 'temperature',
            type: 'number',
            defaultValue: 375,
            unit: '°F',
            min: 200,
            max: 450,
            required: true
          },
          {
            name: 'time',
            type: 'number',
            defaultValue: 15,
            unit: 'minutes',
            min: 1,
            max: 60,
            required: true
          },
          {
            name: 'preheat',
            type: 'boolean',
            defaultValue: true,
            required: false
          }
        ]
      },
      {
        id: 'dehydrate',
        name: 'Dehydrate',
        description: 'Low temperature drying for fruits and vegetables',
        parameters: [
          {
            name: 'temperature',
            type: 'number',
            defaultValue: 135,
            unit: '°F',
            min: 95,
            max: 175,
            required: true
          },
          {
            name: 'time',
            type: 'number',
            defaultValue: 480,
            unit: 'minutes',
            min: 60,
            max: 1440,
            required: true
          }
        ]
      },
      {
        id: 'reheat',
        name: 'Reheat',
        description: 'Gentle reheating to restore food quality',
        parameters: [
          {
            name: 'temperature',
            type: 'number',
            defaultValue: 325,
            unit: '°F',
            min: 200,
            max: 400,
            required: true
          },
          {
            name: 'time',
            type: 'number',
            defaultValue: 10,
            unit: 'minutes',
            min: 1,
            max: 30,
            required: true
          }
        ]
      }
    ]
  }
];

// Helper functions
export const getApplianceById = (categoryId: string): ChefIQAppliance | undefined => {
  return CHEFIQ_APPLIANCES.find(appliance => appliance.category_id === categoryId);
};

export const getCookingMethodById = (categoryId: string, methodId: string): CookingMethod | undefined => {
  const appliance = getApplianceById(categoryId);
  return appliance?.cookingMethods.find(method => method.id === methodId);
};

export const formatCookingAction = (action: CookingAction): string => {
  const method = getCookingMethodById(action.applianceId, action.methodId);
  if (!method) return action.methodName;

  const params = Object.entries(action.parameters)
    .map(([key, value]) => {
      const param = method.parameters.find(p => p.name === key);
      if (!param) return null;

      if (param.type === 'boolean') {
        return value ? param.name : null;
      }

      return `${value}${param.unit || ''}`;
    })
    .filter(Boolean)
    .join(', ');

  return `${action.methodName}${params ? ` (${params})` : ''}`;
};

// Legacy compatibility function
export const getApplianceByLegacyId = (legacyId: string): ChefIQAppliance | undefined => {
  const mapping: { [key: string]: string } = {
    'rj40': 'c8ff3aef-3de6-4a74-bba6-03e943b2762c',
    'cq60': 'a542fa25-5053-4946-8b77-e358467baa0f',
    'cq50': '4a3cd4f1-839b-4f45-80ea-08f594ff74c3'
  };

  const categoryId = mapping[legacyId];
  return categoryId ? getApplianceById(categoryId) : undefined;
};

// Get ChefIQ product URL for an appliance
export const getApplianceProductUrl = (categoryId: string): string => {
  const urlMapping: { [key: string]: string } = {
    'c8ff3aef-3de6-4a74-bba6-03e943b2762c': 'https://chefiq.com/products/iq-cooker', // iQ Cooker
    'a542fa25-5053-4946-8b77-e358467baa0f': 'https://chefiq.com/products/iq-sense', // iQ Sense
    '4a3cd4f1-839b-4f45-80ea-08f594ff74c3': 'https://chefiq.com/products/iq-minioven' // iQ MiniOven
  };

  return urlMapping[categoryId] || 'https://chefiq.com/products';
};