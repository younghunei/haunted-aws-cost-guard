import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Cloud, Database, AlertCircle, CheckCircle, ChevronDown } from 'lucide-react';

interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

interface ModeSelectionProps {
  onModeSelect: (mode: 'demo' | 'aws', credentials?: AWSCredentials) => void;
}

const AWS_REGIONS = [
  // US Regions
  { value: 'us-east-1', label: 'US East (N. Virginia)', group: 'US' },
  { value: 'us-east-2', label: 'US East (Ohio)', group: 'US' },
  { value: 'us-west-1', label: 'US West (N. California)', group: 'US' },
  { value: 'us-west-2', label: 'US West (Oregon)', group: 'US' },
  
  // Europe Regions
  { value: 'eu-central-1', label: 'Europe (Frankfurt)', group: 'Europe' },
  { value: 'eu-west-1', label: 'Europe (Ireland)', group: 'Europe' },
  { value: 'eu-west-2', label: 'Europe (London)', group: 'Europe' },
  { value: 'eu-west-3', label: 'Europe (Paris)', group: 'Europe' },
  { value: 'eu-north-1', label: 'Europe (Stockholm)', group: 'Europe' },
  { value: 'eu-south-1', label: 'Europe (Milan)', group: 'Europe' },
  { value: 'eu-central-2', label: 'Europe (Zurich)', group: 'Europe' },
  
  // Asia Pacific Regions
  { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)', group: 'Asia Pacific' },
  { value: 'ap-northeast-2', label: 'Asia Pacific (Seoul)', group: 'Asia Pacific' },
  { value: 'ap-northeast-3', label: 'Asia Pacific (Osaka)', group: 'Asia Pacific' },
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)', group: 'Asia Pacific' },
  { value: 'ap-southeast-2', label: 'Asia Pacific (Sydney)', group: 'Asia Pacific' },
  { value: 'ap-southeast-3', label: 'Asia Pacific (Jakarta)', group: 'Asia Pacific' },
  { value: 'ap-southeast-4', label: 'Asia Pacific (Melbourne)', group: 'Asia Pacific' },
  { value: 'ap-south-1', label: 'Asia Pacific (Mumbai)', group: 'Asia Pacific' },
  { value: 'ap-south-2', label: 'Asia Pacific (Hyderabad)', group: 'Asia Pacific' },
  { value: 'ap-east-1', label: 'Asia Pacific (Hong Kong)', group: 'Asia Pacific' },
  
  // Canada
  { value: 'ca-central-1', label: 'Canada (Central)', group: 'Canada' },
  { value: 'ca-west-1', label: 'Canada (Calgary)', group: 'Canada' },
  
  // South America
  { value: 'sa-east-1', label: 'South America (São Paulo)', group: 'South America' },
  
  // Africa
  { value: 'af-south-1', label: 'Africa (Cape Town)', group: 'Africa' },
  
  // Middle East
  { value: 'me-south-1', label: 'Middle East (Bahrain)', group: 'Middle East' },
  { value: 'me-central-1', label: 'Middle East (UAE)', group: 'Middle East' },
  
  // Israel
  { value: 'il-central-1', label: 'Israel (Tel Aviv)', group: 'Israel' }
];

export const ModeSelection: React.FC<ModeSelectionProps> = ({ onModeSelect }) => {
  const [selectedMode, setSelectedMode] = useState<'demo' | 'aws' | null>(null);
  const [credentials, setCredentials] = useState<AWSCredentials>({
    accessKeyId: '',
    secretAccessKey: '',
    region: 'us-east-1'
  });
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationSuccess, setValidationSuccess] = useState(false);
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false);
  const [regionSearchTerm, setRegionSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 할로윈 배경 요소들 (Halloween Background Elements)
  const floatingElements = [
    { emoji: '👻', delay: 0, duration: 4 },
    { emoji: '🦇', delay: 1, duration: 3 },
    { emoji: '🕷️', delay: 2, duration: 5 },
    { emoji: '💀', delay: 0.5, duration: 4.5 },
    { emoji: '🎃', delay: 1.5, duration: 3.5 },
    { emoji: '🕸️', delay: 2.5, duration: 4 },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsRegionDropdownOpen(false);
        setRegionSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleModeSelection = (mode: 'demo' | 'aws') => {
    setSelectedMode(mode);
    setValidationError(null);
    setValidationSuccess(false);
    
    if (mode === 'demo') {
      // Immediately proceed with demo mode
      onModeSelect('demo');
    }
  };

  const handleCredentialChange = (field: keyof AWSCredentials, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
    setValidationError(null);
    setValidationSuccess(false);
  };

  const validateCredentials = async () => {
    if (!credentials.accessKeyId || !credentials.secretAccessKey) {
      setValidationError('Please provide both Access Key ID and Secret Access Key');
      return;
    }

    setIsValidating(true);
    setValidationError(null);

    try {
      const response = await fetch('http://localhost:3001/api/cost/validate-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const result = await response.json();

      if (result.success && result.data?.valid) {
        setValidationSuccess(true);
        setValidationError(null);
      } else {
        setValidationError(result.error || 'Invalid credentials or insufficient permissions');
        setValidationSuccess(false);
      }
    } catch (error) {
      setValidationError('Failed to validate credentials. Please check your connection.');
      setValidationSuccess(false);
    } finally {
      setIsValidating(false);
    }
  };

  const proceedWithAWS = () => {
    if (validationSuccess) {
      onModeSelect('aws', credentials);
    }
  };

  const getRegionLabel = (regionValue: string) => {
    const region = AWS_REGIONS.find(r => r.value === regionValue);
    return region ? region.label : regionValue;
  };

  const filteredRegions = AWS_REGIONS.filter(region =>
    region.label.toLowerCase().includes(regionSearchTerm.toLowerCase()) ||
    region.value.toLowerCase().includes(regionSearchTerm.toLowerCase())
  );

  const groupedRegions = filteredRegions.reduce((groups, region) => {
    const group = region.group;
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(region);
    return groups;
  }, {} as Record<string, typeof AWS_REGIONS>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900 to-orange-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* 동적 밤하늘 효과 */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            'radial-gradient(circle at 30% 20%, rgba(30, 27, 75, 0.4) 0%, transparent 40%), radial-gradient(circle at 70% 60%, rgba(75, 0, 130, 0.3) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(139, 69, 19, 0.2) 0%, transparent 30%)',
            'radial-gradient(circle at 60% 30%, rgba(30, 27, 75, 0.5) 0%, transparent 45%), radial-gradient(circle at 40% 70%, rgba(75, 0, 130, 0.4) 0%, transparent 40%), radial-gradient(circle at 80% 20%, rgba(139, 69, 19, 0.3) 0%, transparent 35%)',
            'radial-gradient(circle at 20% 40%, rgba(30, 27, 75, 0.3) 0%, transparent 35%), radial-gradient(circle at 80% 80%, rgba(75, 0, 130, 0.5) 0%, transparent 55%), radial-gradient(circle at 50% 10%, rgba(139, 69, 19, 0.2) 0%, transparent 25%)'
          ]
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      {/* 어두운 밤 속 으스스한 집과 유령들 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* 폭풍우 치는 밤하늘 */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-purple-950 to-black">
          {/* 붉은 달 - 더 무섭게 */}
          <motion.div
            className="absolute top-8 right-8 md:top-12 md:right-16 w-20 h-20 md:w-28 md:h-28 bg-red-800 rounded-full shadow-lg"
            animate={{
              boxShadow: [
                "0 0 30px rgba(139, 0, 0, 0.5)",
                "0 0 60px rgba(139, 0, 0, 0.8)",
                "0 0 30px rgba(139, 0, 0, 0.5)"
              ],
              scale: [1, 1.05, 1]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            {/* 달 표면 - 더 어둡게 */}
            <div className="absolute top-2 left-4 w-3 h-3 bg-red-900 rounded-full opacity-80"></div>
            <div className="absolute top-5 right-3 w-2 h-2 bg-red-900 rounded-full opacity-60"></div>
            <div className="absolute bottom-4 left-3 w-2.5 h-2.5 bg-red-900 rounded-full opacity-70"></div>
          </motion.div>

          {/* 번개 효과 */}
          <motion.div
            className="absolute inset-0"
            animate={{
              backgroundColor: [
                "transparent",
                "rgba(255, 255, 255, 0.1)",
                "transparent"
              ]
            }}
            transition={{
              duration: 0.2,
              repeat: Infinity,
              repeatDelay: 8,
              times: [0, 0.1, 1]
            }}
          />
          
          {/* 번개 모양 */}
          <motion.svg
            className="absolute top-10 left-1/4 w-8 h-32 md:w-12 md:h-40"
            viewBox="0 0 20 80"
            animate={{
              opacity: [0, 1, 0],
              scale: [0.8, 1.2, 0.8]
            }}
            transition={{
              duration: 0.3,
              repeat: Infinity,
              repeatDelay: 12,
              times: [0, 0.1, 1]
            }}
          >
            <path
              d="M10,0 L8,20 L12,20 L6,40 L14,25 L10,25 L16,80"
              fill="#ffffff"
              stroke="#ffff00"
              strokeWidth="1"
            />
          </motion.svg>

          <motion.svg
            className="absolute top-16 right-1/3 w-6 h-24 md:w-10 md:h-32"
            viewBox="0 0 20 80"
            animate={{
              opacity: [0, 1, 0],
              scale: [0.9, 1.1, 0.9]
            }}
            transition={{
              duration: 0.25,
              repeat: Infinity,
              repeatDelay: 15,
              times: [0, 0.1, 1],
              delay: 2
            }}
          >
            <path
              d="M10,0 L8,15 L12,15 L7,35 L13,22 L9,22 L15,60"
              fill="#ffffff"
              stroke="#ffff00"
              strokeWidth="1"
            />
          </motion.svg>

          {/* 어두운 폭풍 구름들 */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={`storm-cloud-${i}`}
              className="absolute opacity-40"
              style={{
                left: `${10 + i * 15}%`,
                top: `${5 + i * 3}%`
              }}
              animate={{
                x: [0, 30, 0],
                opacity: [0.2, 0.5, 0.2],
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 15 + i * 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 1.5
              }}
            >
              <svg width="100" height="50" viewBox="0 0 100 50" className="fill-gray-800">
                <path d="M25,40 Q15,25 25,20 Q30,10 45,20 Q55,5 65,20 Q80,10 80,25 Q85,35 75,40 Z" />
                <path d="M20,35 Q10,25 20,22 Q25,15 35,22 Q40,12 50,22 Q60,15 65,25 Q70,30 65,35 Z" />
              </svg>
            </motion.div>
          ))}
        </div>

        {/* 무서운 마녀의 성 */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-5xl">
          <svg viewBox="0 0 1000 500" className="w-full h-auto filter drop-shadow-lg">
            {/* 성 뒤쪽 조명 효과 */}
            <defs>
              <radialGradient id="castleGlow" cx="50%" cy="80%" r="60%">
                <stop offset="0%" stopColor="rgba(139, 69, 19, 0.3)" />
                <stop offset="50%" stopColor="rgba(75, 0, 130, 0.2)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* 배경 조명 */}
            <ellipse cx="500" cy="400" rx="400" ry="100" fill="url(#castleGlow)" />
            {/* 메인 성 본체 */}
            <path
              d="M150,450 L150,180 L200,160 L250,180 L250,200 L300,180 L350,200 L350,160 L400,140 L450,160 L450,180 L500,160 L550,180 L550,200 L600,180 L650,200 L650,160 L700,140 L750,160 L750,180 L800,160 L850,180 L850,450 Z"
              fill="#2a1a3a"
              stroke="#4a2a5a"
              strokeWidth="3"
            />
            
            {/* 뾰족한 탑들 */}
            <path d="M180,160 L200,60 L220,160 Z" fill="#1a0a2a" stroke="#3a1a4a" strokeWidth="2"/>
            <path d="M380,140 L400,40 L420,140 Z" fill="#1a0a2a" stroke="#3a1a4a" strokeWidth="2"/>
            <path d="M680,140 L700,30 L720,140 Z" fill="#1a0a2a" stroke="#3a1a4a" strokeWidth="2"/>
            <path d="M780,160 L800,50 L820,160 Z" fill="#1a0a2a" stroke="#3a1a4a" strokeWidth="2"/>
            
            {/* 탑 꼭대기 깃발 */}
            <motion.path
              d="M200,60 L200,40 L230,45 L200,50 Z"
              fill="#8b0000"
              animate={{ 
                d: [
                  "M200,60 L200,40 L230,45 L200,50 Z",
                  "M200,60 L200,40 L235,48 L200,52 Z",
                  "M200,60 L200,40 L230,45 L200,50 Z"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.path
              d="M400,40 L400,20 L430,25 L400,30 Z"
              fill="#8b0000"
              animate={{ 
                d: [
                  "M400,40 L400,20 L430,25 L400,30 Z",
                  "M400,40 L400,20 L435,28 L400,32 Z",
                  "M400,40 L400,20 L430,25 L400,30 Z"
                ]
              }}
              transition={{ duration: 1.8, repeat: Infinity, delay: 0.5 }}
            />
            
            {/* 성벽의 톱니 */}
            <path d="M150,180 L170,180 L170,160 L190,160 L190,180 L210,180 L210,160 L230,160 L230,180 L250,180" 
                  fill="none" stroke="#4a2a5a" strokeWidth="2"/>
            <path d="M350,160 L370,160 L370,140 L390,140 L390,160 L410,160 L410,140 L430,140 L430,160 L450,160" 
                  fill="none" stroke="#4a2a5a" strokeWidth="2"/>
            <path d="M550,180 L570,180 L570,160 L590,160 L590,180 L610,180 L610,160 L630,160 L630,180 L650,180" 
                  fill="none" stroke="#4a2a5a" strokeWidth="2"/>
            <path d="M750,160 L770,160 L770,140 L790,140 L790,160 L810,160 L810,140 L830,140 L830,160 L850,160" 
                  fill="none" stroke="#4a2a5a" strokeWidth="2"/>

            {/* 무서운 창문들 - 빨간 불빛 */}
            <motion.rect
              x="180" y="220" width="25" height="35"
              fill="#ff0000"
              animate={{ opacity: [0.4, 0.9, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0 }}
            />
            <motion.rect
              x="220" y="240" width="20" height="30"
              fill="#ff3300"
              animate={{ opacity: [0.6, 0.2, 0.6] }}
              transition={{ duration: 3, repeat: Infinity, delay: 1 }}
            />
            <motion.rect
              x="380" y="200" width="30" height="40"
              fill="#cc0000"
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
            />
            <motion.rect
              x="420" y="220" width="25" height="35"
              fill="#ff0000"
              animate={{ opacity: [0.7, 0.3, 0.7] }}
              transition={{ duration: 4, repeat: Infinity, delay: 2 }}
            />
            <motion.rect
              x="580" y="230" width="28" height="38"
              fill="#ff1100"
              animate={{ opacity: [0.2, 0.7, 0.2] }}
              transition={{ duration: 3.5, repeat: Infinity, delay: 1.5 }}
            />
            <motion.rect
              x="620" y="210" width="22" height="32"
              fill="#ff0000"
              animate={{ opacity: [0.5, 0.9, 0.5] }}
              transition={{ duration: 2.8, repeat: Infinity, delay: 0.8 }}
            />
            <motion.rect
              x="780" y="200" width="30" height="40"
              fill="#cc0000"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 3.2, repeat: Infinity, delay: 1.2 }}
            />

            {/* 거대한 성문 */}
            <path d="M450,450 L450,320 Q450,300 470,300 L530,300 Q550,300 550,320 L550,450 Z" 
                  fill="#3a1a2a" stroke="#5a2a4a" strokeWidth="3"/>
            
            {/* 성문의 철창 */}
            <rect x="465" y="330" width="3" height="120" fill="#5a3a4a"/>
            <rect x="475" y="330" width="3" height="120" fill="#5a3a4a"/>
            <rect x="485" y="330" width="3" height="120" fill="#5a3a4a"/>
            <rect x="495" y="330" width="3" height="120" fill="#5a3a4a"/>
            <rect x="505" y="330" width="3" height="120" fill="#5a3a4a"/>
            <rect x="515" y="330" width="3" height="120" fill="#5a3a4a"/>
            <rect x="525" y="330" width="3" height="120" fill="#5a3a4a"/>
            <rect x="535" y="330" width="3" height="120" fill="#5a3a4a"/>
            
            {/* 성문 위 해골 장식 */}
            <motion.circle cx="500" cy="310" r="8" fill="#f0f0f0" 
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <circle cx="496" cy="307" r="2" fill="#000"/>
            <circle cx="504" cy="307" r="2" fill="#000"/>
            <path d="M495,312 L505,312 L500,318 Z" fill="#000"/>

            {/* 가고일들 */}
            <motion.g
              animate={{ 
                y: [0, -3, 0],
                rotate: [0, 2, -2, 0]
              }}
              transition={{ duration: 4, repeat: Infinity, delay: 0 }}
            >
              <path d="M280,180 Q275,170 285,170 Q290,165 285,175 Q295,175 290,185 L285,190 L280,185 Z" 
                    fill="#4a4a5a" stroke="#6a5a7a" strokeWidth="1"/>
              <circle cx="283" cy="175" r="1.5" fill="#ff0000"/>
            </motion.g>
            
            <motion.g
              animate={{ 
                y: [0, -4, 0],
                rotate: [0, -2, 2, 0]
              }}
              transition={{ duration: 3.5, repeat: Infinity, delay: 1 }}
            >
              <path d="M720,180 Q715,170 725,170 Q730,165 725,175 Q735,175 730,185 L725,190 L720,185 Z" 
                    fill="#4a4a5a" stroke="#6a5a7a" strokeWidth="1"/>
              <circle cx="723" cy="175" r="1.5" fill="#ff0000"/>
            </motion.g>

            {/* 굴뚝에서 나오는 연기 */}
            <motion.path
              d="M210,160 Q215,150 210,140 Q205,130 215,120 Q220,110 210,100"
              fill="none" stroke="#666" strokeWidth="3" opacity="0.8"
              animate={{ 
                d: [
                  "M210,160 Q215,150 210,140 Q205,130 215,120 Q220,110 210,100",
                  "M210,160 Q205,150 215,140 Q220,130 210,120 Q205,110 220,100",
                  "M210,160 Q220,150 205,140 Q210,130 205,120 Q215,110 205,100"
                ]
              }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <motion.path
              d="M410,140 Q415,130 410,120 Q405,110 415,100 Q420,90 410,80"
              fill="none" stroke="#666" strokeWidth="3" opacity="0.8"
              animate={{ 
                d: [
                  "M410,140 Q415,130 410,120 Q405,110 415,100 Q420,90 410,80",
                  "M410,140 Q405,130 415,120 Q420,110 410,100 Q405,90 420,80",
                  "M410,140 Q420,130 405,120 Q410,110 405,100 Q415,90 405,80"
                ]
              }}
              transition={{ duration: 3.5, repeat: Infinity, delay: 1 }}
            />

            {/* 으스스한 나무들 - 더 무섭게 */}
            <path
              d="M50,450 L55,300 Q50,280 60,285 Q65,275 55,270 Q45,275 50,285 Q40,280 45,300 L40,320 Q35,310 45,315 Q50,305 40,300 Q30,305 35,315 L30,450"
              fill="#2a1a2a"
              stroke="#4a2a4a"
              strokeWidth="1"
            />
            <path
              d="M920,450 L915,320 Q920,300 910,305 Q905,295 915,290 Q925,295 920,305 Q930,300 925,320 L930,340 Q935,330 925,335 Q920,325 930,320 Q940,325 935,335 L940,450"
              fill="#2a1a2a"
              stroke="#4a2a4a"
              strokeWidth="1"
            />
            
            {/* 나무에 매달린 해골 */}
            <motion.g
              animate={{ 
                rotate: [0, 5, -5, 0],
                y: [0, 2, 0]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <circle cx="45" cy="320" r="4" fill="#f0f0f0"/>
              <circle cx="43" cy="318" r="1" fill="#000"/>
              <circle cx="47" cy="318" r="1" fill="#000"/>
              <path d="M42,322 L48,322 L45,326 Z" fill="#000"/>
            </motion.g>

            {/* 성 주변 무덤들 */}
            <rect x="100" y="420" width="30" height="30" fill="#3a2a3a" stroke="#5a4a5a" strokeWidth="1"/>
            <path d="M115,420 L115,410 L120,410 L120,420" fill="#5a4a5a"/>
            <rect x="880" y="430" width="25" height="20" fill="#3a2a3a" stroke="#5a4a5a" strokeWidth="1"/>
            <path d="M892,430 L892,422 L897,422 L897,430" fill="#5a4a5a"/>
          </svg>
        </div>

        {/* 무서운 유령들과 악령들 */}
        {[
          { emoji: '👻', x: '12%', y: '20%', size: 'text-7xl md:text-9xl', delay: 0, duration: 8 },
          { emoji: '💀', x: '78%', y: '30%', size: 'text-6xl md:text-8xl', delay: 2, duration: 10 },
          { emoji: '👹', x: '20%', y: '45%', size: 'text-5xl md:text-7xl', delay: 4, duration: 9 },
          { emoji: '👻', x: '70%', y: '15%', size: 'text-8xl md:text-10xl', delay: 1, duration: 11 },
          { emoji: '💀', x: '88%', y: '55%', size: 'text-6xl md:text-8xl', delay: 3, duration: 7 },
          { emoji: '👹', x: '8%', y: '60%', size: 'text-5xl md:text-7xl', delay: 5, duration: 12 },
          { emoji: '🔥', x: '45%', y: '25%', size: 'text-4xl md:text-6xl', delay: 2.5, duration: 6 },
        ].map((spirit, index) => (
          <motion.div
            key={`spirit-${index}`}
            className={`absolute ${spirit.size} opacity-25 select-none filter drop-shadow-2xl`}
            style={{ 
              left: spirit.x, 
              top: spirit.y,
              textShadow: spirit.emoji === '🔥' ? '0 0 20px #ff4500' : '0 0 15px #8b0000'
            }}
            animate={{
              y: [0, -50, 0],
              x: [0, 40, -20, 0],
              rotate: [0, 12, -12, 0],
              scale: [1, 1.3, 0.8, 1],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{
              duration: spirit.duration,
              delay: spirit.delay,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {spirit.emoji}
          </motion.div>
        ))}

        {/* 박쥐들 */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`bat-${i}`}
            className="absolute text-2xl md:text-3xl opacity-30"
            initial={{ 
              x: '-10%', 
              y: `${20 + Math.random() * 40}%`
            }}
            animate={{ 
              x: '110%', 
              y: `${15 + Math.random() * 50}%`
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              delay: i * 2,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            🦇
          </motion.div>
        ))}

        {/* 무서운 안개와 독기 */}
        {[...Array(7)].map((_, i) => (
          <motion.div
            key={`evil-fog-${i}`}
            className="absolute bottom-0 w-56 h-40 md:w-72 md:h-48 rounded-full blur-3xl bg-gradient-to-t from-red-900/30 via-purple-900/20 to-green-900/10"
            animate={{
              x: [0, 120, -60, 0],
              scale: [1, 1.6, 0.7, 1],
              opacity: [0.15, 0.5, 0.15]
            }}
            transition={{
              duration: 18 + i * 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 2.5
            }}
            style={{
              left: `${i * 15}%`,
              bottom: '-15%'
            }}
          />
        ))}

        {/* 떠다니는 해골들 (Floating Skulls) */}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={`floating-skull-${i}`}
            className="absolute text-3xl md:text-4xl opacity-30"
            initial={{ 
              x: `${Math.random() * 100}%`, 
              y: `${50 + Math.random() * 30}%`
            }}
            animate={{ 
              x: `${Math.random() * 100}%`, 
              y: `${40 + Math.random() * 40}%`,
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: 15 + Math.random() * 5,
              delay: Math.random() * 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            💀
          </motion.div>
        ))}

        {/* 악마의 눈 효과 */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`evil-eyes-${i}`}
            className="absolute w-2 h-2 bg-red-500 rounded-full shadow-lg"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + Math.random() * 40}%`,
              boxShadow: '0 0 10px #ff0000'
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0.5, 1.5, 0.5]
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              delay: Math.random() * 5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}

        {/* 떨어지는 나뭇잎들 */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`leaf-${i}`}
            className="absolute text-lg md:text-xl opacity-40"
            initial={{ 
              x: `${Math.random() * 100}%`, 
              y: '-5%',
              rotate: 0 
            }}
            animate={{ 
              x: `${Math.random() * 100}%`, 
              y: '105%',
              rotate: 360 
            }}
            transition={{
              duration: 10 + Math.random() * 5,
              delay: Math.random() * 5,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            🍂
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full relative z-10"
      >
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-6xl font-bold text-white mb-4 relative"
          >
            <motion.span
              animate={{ 
                textShadow: [
                  "0 0 10px #ff6b35",
                  "0 0 20px #ff6b35", 
                  "0 0 10px #ff6b35"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🎃 Haunted AWS Cost Guard 👻
            </motion.span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-orange-200 mb-8"
          >
            <motion.span
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              🕯️ Transform your AWS billing into a supernatural experience 🕯️
            </motion.span>
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Demo Mode Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 0 30px rgba(255, 107, 53, 0.5)"
            }}
            className={`bg-gradient-to-br from-orange-900/40 to-black/60 backdrop-blur-lg rounded-xl p-6 border-2 cursor-pointer transition-all duration-300 relative overflow-hidden ${
              selectedMode === 'demo'
                ? 'border-orange-400 bg-orange-400/20 shadow-lg shadow-orange-500/30'
                : 'border-orange-300/30 hover:border-orange-400 hover:bg-orange-900/30'
            }`}
            onClick={() => handleModeSelection('demo')}
          >
            {/* 할로윈 장식 (Halloween Decoration) */}
            <div className="absolute top-2 right-2 text-2xl animate-bounce">🎃</div>
            <div className="absolute bottom-2 left-2 text-lg opacity-50">🕷️</div>
            
            <div className="text-center relative z-10">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Database className="w-16 h-16 text-orange-300 mx-auto mb-4" />
              </motion.div>
              <h3 className="text-2xl font-bold text-white mb-3">
                👻 Demo Mode 👻
              </h3>
              <p className="text-orange-200 mb-4">
                🏚️ Explore the haunted mansion with sample AWS cost data. Perfect for demonstrations and getting familiar with the spooky interface.
              </p>
              <div className="space-y-2 text-sm text-orange-300">
                <div className="flex items-center justify-center">
                  <motion.span
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                  >
                    ✅
                  </motion.span>
                  <span className="ml-2">No AWS credentials required</span>
                </div>
                <div className="flex items-center justify-center">
                  <motion.span
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  >
                    ✅
                  </motion.span>
                  <span className="ml-2">Realistic sample data</span>
                </div>
                <div className="flex items-center justify-center">
                  <motion.span
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                  >
                    ✅
                  </motion.span>
                  <span className="ml-2">Full feature access</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* AWS Mode Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 0 30px rgba(139, 92, 246, 0.5)"
            }}
            className={`bg-gradient-to-br from-purple-900/40 to-black/60 backdrop-blur-lg rounded-xl p-6 border-2 cursor-pointer transition-all duration-300 relative overflow-hidden ${
              selectedMode === 'aws'
                ? 'border-purple-400 bg-purple-400/20 shadow-lg shadow-purple-500/30'
                : 'border-purple-300/30 hover:border-purple-400 hover:bg-purple-900/30'
            }`}
            onClick={() => handleModeSelection('aws')}
          >
            {/* 할로윈 장식 (Halloween Decoration) */}
            <div className="absolute top-2 right-2 text-2xl">🦇</div>
            <div className="absolute bottom-2 left-2 text-lg opacity-50">💀</div>
            
            <div className="text-center relative z-10">
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Cloud className="w-16 h-16 text-purple-300 mx-auto mb-4" />
              </motion.div>
              <h3 className="text-2xl font-bold text-white mb-3">
                ☁️ AWS Account ⚡
              </h3>
              <p className="text-purple-200 mb-4">
                🔮 Connect to your real AWS account to monitor actual costs and usage. Requires AWS credentials with Cost Explorer access.
              </p>
              <div className="space-y-2 text-sm text-purple-300">
                <div className="flex items-center justify-center">
                  <motion.span
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 3, repeat: Infinity, delay: 0 }}
                  >
                    🔑
                  </motion.span>
                  <span className="ml-2">Real-time cost data</span>
                </div>
                <div className="flex items-center justify-center">
                  <motion.span
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                  >
                    🔑
                  </motion.span>
                  <span className="ml-2">AWS Cost Explorer integration</span>
                </div>
                <div className="flex items-center justify-center">
                  <motion.span
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 3, repeat: Infinity, delay: 2 }}
                  >
                    🔑
                  </motion.span>
                  <span className="ml-2">Secure credential handling</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* AWS Credentials Form */}
        {selectedMode === 'aws' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-gradient-to-br from-purple-900/40 to-black/60 backdrop-blur-lg rounded-xl p-6 border border-purple-300/30 relative overflow-hidden"
          >
            {/* 할로윈 장식 (Halloween Decoration) */}
            <div className="absolute top-2 right-2 text-xl opacity-30">🕸️</div>
            <div className="absolute bottom-2 right-2 text-lg opacity-30">🔮</div>
            
            <h4 className="text-xl font-bold text-white mb-4 flex items-center">
              <motion.span
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="mr-2"
              >
                🗝️
              </motion.span>
              AWS Credentials
              <motion.span
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="ml-2"
              >
                ⚡
              </motion.span>
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Access Key ID
                </label>
                <input
                  type="text"
                  value={credentials.accessKeyId}
                  onChange={(e) => handleCredentialChange('accessKeyId', e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-blue-400"
                  placeholder="AKIA..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Secret Access Key
                </label>
                <input
                  type="password"
                  value={credentials.secretAccessKey}
                  onChange={(e) => handleCredentialChange('secretAccessKey', e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-blue-400"
                  placeholder="Enter your secret access key"
                />
              </div>
              
              <div className="relative" ref={dropdownRef}>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Region
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsRegionDropdownOpen(!isRegionDropdownOpen)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400 flex items-center justify-between"
                  >
                    <span>{getRegionLabel(credentials.region)}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isRegionDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isRegionDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-white/20 rounded-lg shadow-lg z-10 max-h-80 overflow-hidden"
                    >
                      {/* Search Input */}
                      <div className="p-3 border-b border-white/20">
                        <input
                          type="text"
                          placeholder="Search regions..."
                          value={regionSearchTerm}
                          onChange={(e) => setRegionSearchTerm(e.target.value)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 text-sm focus:outline-none focus:border-blue-400"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      
                      {/* Regions List */}
                      <div className="max-h-64 overflow-y-auto">
                        {Object.entries(groupedRegions).map(([groupName, regions]) => (
                          <div key={groupName}>
                            <div className="px-4 py-2 text-xs font-semibold text-gray-400 bg-gray-700/50 sticky top-0">
                              {groupName}
                            </div>
                            {regions.map((region) => (
                              <button
                                key={region.value}
                                type="button"
                                onClick={() => {
                                  handleCredentialChange('region', region.value);
                                  setIsRegionDropdownOpen(false);
                                  setRegionSearchTerm('');
                                }}
                                className={`w-full px-4 py-2 text-left text-white hover:bg-white/10 transition-colors text-sm ${
                                  credentials.region === region.value ? 'bg-blue-600/50' : ''
                                }`}
                              >
                                <div className="flex justify-between items-center">
                                  <span>{region.label}</span>
                                  <span className="text-xs text-gray-400">{region.value}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        ))}
                        
                        {filteredRegions.length === 0 && (
                          <div className="px-4 py-3 text-center text-gray-400 text-sm">
                            No regions found matching "{regionSearchTerm}"
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {validationError && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center text-red-400 text-sm"
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {validationError}
                </motion.div>
              )}

              {validationSuccess && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center text-green-400 text-sm"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Credentials validated successfully!
                </motion.div>
              )}

              <div className="flex space-x-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={validateCredentials}
                  disabled={isValidating || !credentials.accessKeyId || !credentials.secretAccessKey}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-lg"
                >
                  {isValidating ? (
                    <span className="flex items-center justify-center">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="mr-2"
                      >
                        🔮
                      </motion.span>
                      Validating...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      🧙‍♂️ Validate Credentials
                    </span>
                  )}
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={proceedWithAWS}
                  disabled={!validationSuccess}
                  className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-lg"
                >
                  <span className="flex items-center justify-center">
                    🏚️ Enter the Mansion 👻
                  </span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};