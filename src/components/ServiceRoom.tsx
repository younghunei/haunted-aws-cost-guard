import React, { useRef, useEffect, useState } from 'react';
import { Rect, Group, Text, Circle } from 'react-konva';
import { motion } from 'framer-motion';
import Konva from 'konva';
import { performanceMonitor, QualitySettings } from '../services/performanceMonitor';
import { accessibilityService } from '../services/accessibilityService';

interface ServiceRoomProps {
  service: {
    service: string;
    displayName: string;
    totalCost: number;
    budgetUtilization: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  };
  position: { x: number; y: number };
  onSelect: () => void;
  isSelected: boolean;
}

export const ServiceRoom: React.FC<ServiceRoomProps> = ({
  service,
  position,
  onSelect,
  isSelected
}) => {
  const groupRef = useRef<Konva.Group>(null);
  const entityRef = useRef<Konva.Circle>(null);
  const [qualitySettings, setQualitySettings] = useState<QualitySettings>(
    performanceMonitor.getQualitySettings()
  );
  const [isFocused, setIsFocused] = useState(false);

  // Subscribe to performance updates
  useEffect(() => {
    const unsubscribe = performanceMonitor.subscribe((_, quality) => {
      setQualitySettings(quality);
    });
    return unsubscribe;
  }, []);

  // 텍스트 길이에 따른 처리 함수
  const formatDisplayName = (name: string) => {
    if (name.length <= 20) return name;
    if (name.length <= 35) return name;
    return name.substring(0, 32) + '...';
  };

  // 여러 줄 텍스트 처리
  const getDisplayNameLines = (name: string) => {
    const maxCharsPerLine = 20;
    if (name.length <= maxCharsPerLine) {
      return [name];
    }
    
    const words = name.split(' ');
    const lines = [];
    let currentLine = '';
    
    for (const word of words) {
      if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
        currentLine = currentLine ? currentLine + ' ' + word : word;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // 단어가 너무 길면 자름
          lines.push(word.substring(0, maxCharsPerLine - 3) + '...');
          currentLine = '';
        }
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines.slice(0, 2); // 최대 2줄만
  };

  // Determine entity type based on budget utilization (with accessibility colors)
  const getEntityConfig = (utilization: number) => {
    const accessibleColor = accessibilityService.getAccessibleEntityColor(utilization);
    
    if (utilization <= 0.5) {
      return {
        type: 'peaceful_ghost',
        color: accessibleColor.color,
        size: Math.min(20 + utilization * 20, qualitySettings.maxEntities > 30 ? 40 : 30),
        intensity: 0.3 + utilization * 0.4,
        pulseSpeed: 3 * qualitySettings.animationSpeed,
        particleCount: Math.min(5, qualitySettings.particleCount / 4)
      };
    } else if (utilization <= 1.0) {
      return {
        type: 'agitated_spirit',
        color: accessibleColor.color,
        size: Math.min(30 + (utilization - 0.5) * 40, qualitySettings.maxEntities > 30 ? 70 : 50),
        intensity: 0.7 + (utilization - 0.5) * 0.6,
        pulseSpeed: 2 * qualitySettings.animationSpeed,
        particleCount: Math.min(10, qualitySettings.particleCount / 2)
      };
    } else {
      return {
        type: 'boss_monster',
        color: accessibleColor.color,
        size: Math.min(50 + Math.min((utilization - 1.0) * 30, 50), qualitySettings.maxEntities > 30 ? 100 : 70),
        intensity: 1.0,
        pulseSpeed: 1 * qualitySettings.animationSpeed,
        particleCount: Math.min(20, qualitySettings.particleCount)
      };
    }
  };

  const entityConfig = getEntityConfig(service.budgetUtilization);
  const displayNameLines = getDisplayNameLines(service.displayName);

  // Determine room background color
  const getRoomBackground = () => {
    if (service.budgetUtilization <= 0.5) {
      return '#1e1b4b'; // 어두운 보라 - 평온
    } else if (service.budgetUtilization <= 1.0) {
      return '#7c2d12'; // 어두운 주황 - 경고
    } else {
      return '#7f1d1d'; // 어두운 빨강 - 위험
    }
  };

  // 애니메이션 효과 (performance optimized)
  useEffect(() => {
    if (!entityRef.current || qualitySettings.level === 'low') return;

    const entity = entityRef.current;
    
    // 맥박 애니메이션 (reduced frequency for better performance)
    const pulseAnimation = new Konva.Animation((frame) => {
      if (!frame) return;
      
      const scale = 1 + Math.sin(frame.time * 0.01 * entityConfig.pulseSpeed) * 0.2 * entityConfig.intensity;
      entity.scale({ x: scale, y: scale });
      
      // 투명도 변화 (only for medium+ quality)
      if (qualitySettings.level !== 'low') {
        const opacity = 0.6 + Math.sin(frame.time * 0.005 * entityConfig.pulseSpeed) * 0.4 * entityConfig.intensity;
        entity.opacity(opacity);
      }
    }, entity.getLayer());

    pulseAnimation.start();

    return () => {
      pulseAnimation.stop();
    };
  }, [entityConfig, qualitySettings]);

  // 호버 및 포커스 효과
  const handleMouseEnter = () => {
    if (!groupRef.current || qualitySettings.level === 'low') return;
    
    groupRef.current.to({
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 0.2
    });
    
    // Announce room details for screen readers
    const description = accessibilityService.generateServiceRoomDescription(service);
    accessibilityService.announce(description.description);
  };

  const handleMouseLeave = () => {
    if (!groupRef.current || qualitySettings.level === 'low') return;
    
    groupRef.current.to({
      scaleX: 1,
      scaleY: 1,
      duration: 0.2
    });
  };

  const handleFocus = () => {
    setIsFocused(true);
    handleMouseEnter();
  };

  const handleBlur = () => {
    setIsFocused(false);
    handleMouseLeave();
  };

  const handleKeyDown = (e: any) => {
    if (e.evt.key === 'Enter' || e.evt.key === ' ') {
      e.evt.preventDefault();
      onSelect();
    }
  };

  // Generate accessibility attributes
  const accessibilityDesc = accessibilityService.generateServiceRoomDescription(service);

  return (
    <Group
      ref={groupRef}
      x={position.x}
      y={position.y}
      onClick={onSelect}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      // Accessibility attributes
      role="button"
      aria-label={accessibilityDesc.label}
      aria-describedby={`room-${service.service}-desc`}
      aria-pressed={isSelected}
    >
      {/* Room Background */}
      <Rect
        width={270}
        height={170}
        fill={getRoomBackground()}
        stroke={isSelected || isFocused ? '#3b82f6' : entityConfig.color}
        strokeWidth={isSelected || isFocused ? 4 : 2}
        cornerRadius={12}
        shadowColor="black"
        shadowBlur={qualitySettings.shadowQuality ? 10 : 0}
        shadowOpacity={qualitySettings.shadowQuality ? 0.8 : 0}
      />

      {/* Room Title - Multi-line Support */}
      {displayNameLines.map((line, index) => (
        <Text
          key={index}
          x={10}
          y={10 + index * 16}
          text={line}
          width={260}
          fontSize={13}
          fontFamily="Arial"
          fill="#ffffff"
          fontStyle="bold"
        />
      ))}

      {/* Cost Information */}
      <Text
        x={10}
        y={displayNameLines.length > 1 ? 50 : 35}
        text={`$${service.totalCost.toLocaleString()}`}
        fontSize={14}
        fontFamily="Arial"
        fill="#fbbf24"
        fontStyle="bold"
      />

      {/* Budget Utilization */}
      <Text
        x={10}
        y={displayNameLines.length > 1 ? 70 : 55}
        text={`Budget Usage: ${(service.budgetUtilization * 100).toFixed(1)}%`}
        width={260}
        fontSize={11}
        fontFamily="Arial"
        fill={entityConfig.color}
      />

      {/* 중앙의 악령/몬스터 */}
      <Circle
        ref={entityRef}
        x={140}
        y={120}
        radius={entityConfig.size}
        fill={entityConfig.color}
        shadowColor={entityConfig.color}
        shadowBlur={20}
        shadowOpacity={0.8}
      />

      {/* 추가 파티클 효과들 (performance optimized) */}
      {qualitySettings.level !== 'low' && [...Array(Math.floor(entityConfig.particleCount / 3))].map((_, i) => (
        <Circle
          key={i}
          x={100 + Math.random() * 120}
          y={90 + Math.random() * 80}
          radius={2 + Math.random() * 4}
          fill={entityConfig.color}
          opacity={0.3 + Math.random() * 0.4}
        />
      ))}

      {/* Budget Status Indicator */}
      <Text
        x={240}
        y={15}
        text={
          service.budgetUtilization > 1.0 ? '🚨' : 
          service.budgetUtilization > 0.8 ? '⚠️' : 
          service.budgetUtilization > 0.5 ? '📊' : '✅'
        }
        fontSize={18}
      />

      {/* 선택 및 포커스 상태 표시 */}
      {(isSelected || isFocused) && (
        <Rect
          width={280}
          height={180}
          stroke={isFocused ? "#3b82f6" : "#fbbf24"}
          strokeWidth={3}
          cornerRadius={12}
          dash={[10, 5]}
        />
      )}
      
      {/* Hidden accessibility description */}
      <Text
        id={`room-${service.service}-desc`}
        x={-1000}
        y={-1000}
        text={accessibilityDesc.description}
        fontSize={0}
        opacity={0}
      />
    </Group>
  );
};