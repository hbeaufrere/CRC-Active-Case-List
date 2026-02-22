import type { Urgency, Status } from '@/types';

export const URGENCY_CONFIG: Record<Urgency, { label: string; color: string; bgColor: string; borderColor: string; dotColor: string }> = {
  critical: {
    label: 'Critical',
    color: 'text-red-800',
    bgColor: 'bg-red-50',
    borderColor: 'border-l-red-500',
    dotColor: 'bg-red-500',
  },
  high: {
    label: 'High',
    color: 'text-orange-800',
    bgColor: 'bg-orange-50',
    borderColor: 'border-l-orange-500',
    dotColor: 'bg-orange-500',
  },
  moderate: {
    label: 'Moderate',
    color: 'text-yellow-800',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-l-yellow-400',
    dotColor: 'bg-yellow-500',
  },
  stable: {
    label: 'Stable',
    color: 'text-green-800',
    bgColor: 'bg-green-50',
    borderColor: 'border-l-green-400',
    dotColor: 'bg-green-500',
  },
  routine: {
    label: 'Routine',
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
    borderColor: 'border-l-gray-300',
    dotColor: 'bg-gray-400',
  },
};

export const STATUS_CONFIG: Record<Status, { label: string; color: string; bgColor: string }> = {
  active: { label: 'Active', color: 'text-blue-800', bgColor: 'bg-blue-100' },
  released: { label: 'Released', color: 'text-green-800', bgColor: 'bg-green-100' },
  deceased: { label: 'Deceased', color: 'text-gray-800', bgColor: 'bg-gray-200' },
  transferred: { label: 'Transferred', color: 'text-purple-800', bgColor: 'bg-purple-100' },
  permanent: { label: 'Permanent', color: 'text-indigo-800', bgColor: 'bg-indigo-100' },
};

export const SPECIES_LIST = [
  { commonName: 'Red-tailed Hawk', scientificName: 'Buteo jamaicensis' },
  { commonName: 'Red-shouldered Hawk', scientificName: 'Buteo lineatus' },
  { commonName: "Cooper's Hawk", scientificName: 'Accipiter cooperii' },
  { commonName: 'Sharp-shinned Hawk', scientificName: 'Accipiter striatus' },
  { commonName: "Swainson's Hawk", scientificName: 'Buteo swainsoni' },
  { commonName: 'Ferruginous Hawk', scientificName: 'Buteo regalis' },
  { commonName: 'Great Horned Owl', scientificName: 'Bubo virginianus' },
  { commonName: 'Barn Owl', scientificName: 'Tyto alba' },
  { commonName: 'Western Screech-Owl', scientificName: 'Megascops kennicottii' },
  { commonName: 'Burrowing Owl', scientificName: 'Athene cunicularia' },
  { commonName: 'Long-eared Owl', scientificName: 'Asio otus' },
  { commonName: 'Short-eared Owl', scientificName: 'Asio flammeus' },
  { commonName: 'Northern Saw-whet Owl', scientificName: 'Aegolius acadicus' },
  { commonName: 'American Kestrel', scientificName: 'Falco sparverius' },
  { commonName: 'Peregrine Falcon', scientificName: 'Falco peregrinus' },
  { commonName: 'Prairie Falcon', scientificName: 'Falco mexicanus' },
  { commonName: 'Merlin', scientificName: 'Falco columbarius' },
  { commonName: 'Golden Eagle', scientificName: 'Aquila chrysaetos' },
  { commonName: 'Bald Eagle', scientificName: 'Haliaeetus leucocephalus' },
  { commonName: 'Turkey Vulture', scientificName: 'Cathartes aura' },
  { commonName: 'Osprey', scientificName: 'Pandion haliaetus' },
  { commonName: 'White-tailed Kite', scientificName: 'Elanus leucurus' },
  { commonName: 'Northern Harrier', scientificName: 'Circus hudsonius' },
];

export const URGENCY_ORDER: Urgency[] = ['critical', 'high', 'moderate', 'stable', 'routine'];

export const LOCATION_OPTIONS = [
  'Nursery',
  'Quarantine',
  'J run',
  'L flight',
  'South flight',
  'NE run',
  'NE flight',
  'O flight',
] as const;
