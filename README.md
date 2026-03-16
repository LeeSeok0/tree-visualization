# 트리 시각화 라이브러리

모든 종류의 계층적 데이터 구조를 직관적인 트리 다이어그램으로 시각화하는 JavaScript 라이브러리입니다.

> ⚠️ **현재 라이브러리화 작업이 진행중입니다.** 독립적인 모듈로 사용할 수 있도록 준비중이니 추후 업데이트를 기대해주세요.

## 개요

이 라이브러리는 복잡한 계층 구조를 직관적인 트리 다이어그램으로 표현합니다. 현재는 태양광 발전소, ESS(에너지 저장 시스템) 등 에너지 관련 설비들의 설치 장소와 장비를 관리하고 모니터링하는데 최적화되어 있지만, **조직도, 파일 시스템, 의사결정 트리, 가족 계보, 마인드맵, 네트워크 토폴로지** 등 다양한 계층적 데이터 구조의 시각화에도 활용할 수 있습니다.

## 주요 기능

### 1. 트리 구조 시각화
- 계층적 노드 구조를 자동으로 배치
- 부모-자식 관계를 연결선으로 표현
- 노드 타입별 아이콘 표시 (일반, 메인, 태양광, ESS)

### 2. 노드 관리
- **설치 장소 관리**: 추가, 수정, 삭제 기능
- **장비 관리**: 각 노드에 장비 정보 추가/수정/삭제
- **동적 업데이트**: 실시간으로 트리 구조 변경

### 3. 사용자 인터랙션
- **줌 인/아웃**: Ctrl + 마우스 휠로 확대/축소
- **드래그 스크롤**: Ctrl + 마우스 드래그로 화면 이동
- **모달 창**: 직관적인 UI로 정보 입력 및 수정

### 4. 실시간 모니터링
- WebSocket을 통한 장비 상태 실시간 체크
- 연결 상태 시각적 표시 (연결/비연결/로딩)
- Power 및 PV 시스템 별도 모니터링

## 구조

### 핵심 모듈

#### `Node` (node.js)
트리의 개별 노드를 나타내는 클래스입니다.

**주요 속성:**
- `data`: 노드의 데이터 (id, name, emplacementType 등)
- `parent`: 부모 노드 참조
- `children`: 자식 노드 배열
- `x, y`: 노드의 좌표
- `width, height`: 노드 크기

**주요 메서드:**
- `addChild(data)`: 자식 노드 추가
- `removeNode()`: 노드 삭제
- `openPlaceModal(type, drawer)`: 설치 장소 모달 열기
- `openEquipmentModal(drawer)`: 장비 모달 열기

#### `Drawer` (drawer.js)
트리를 화면에 렌더링하는 클래스입니다.

**주요 메서드:**
- `draw()`: 전체 트리 그리기
- `setNodes()`: 노드 위치 계산 및 배치
- `renderNodes(node)`: 노드 DOM 요소 생성
- `renderLines(node)`: 연결선 그리기
- `zoomIn/zoomOut(node)`: 확대/축소
- `checkEquipStatus(node)`: 장비 상태 확인

#### 메인 컨트롤러 (index.js)
애플리케이션 초기화 및 이벤트 처리를 담당합니다.

**주요 기능:**
- 서버에서 데이터 로드
- 사용자 인터랙션 처리
- 트리 초기화 및 업데이트

## 노드 타입

### 1. 일반 노드
기본 설치 장소를 나타냅니다.

### 2. 메인 노드 (emplacementType: 1)
주요 설치 장소를 나타냅니다.

### 3. 태양광 노드 (emplacementType: 3)
- 태양광 패널 설치 장소
- 특별한 레이아웃 적용 (수직 정렬)
- 설치 용량 정보 포함

### 4. ESS 노드 (emplacementType: 4)
에너지 저장 시스템 설치 장소를 나타냅니다.

## 데이터 구조

### 노드 데이터 형식
```javascript
{
  id: 1,
  parentId: null, // null이면 루트 노드
  name: "설치장소명",
  emplacementType: 1, // 1: 메인, 2: 일반, 3: 태양광, 4: ESS
  wiringType: "3P4W",
  volt: "380",
  voltAmpere: "100",
  installationCapacity: "50", // 태양광 전용
  isDisplay: true,
  equipment: { // 장비 정보 (선택사항)
    result: {
      mac: "AA:BB:CC:DD:EE:FF",
      equipType: "METER",
      initialSetting: {
        alias: "장비명",
        ip: "192.168.1.100",
        port: "502",
        // ... 기타 설정
      }
    }
  }
}
```

## API 연동

현재 구현은 에너지 관리 시스템용 API를 사용하고 있으나, **백엔드 API는 프로젝트에 맞게 자유롭게 구성 가능합니다**.

### 필수 데이터 구조

#### 트리 데이터 로드 응답 형식
```json
[
  {
    "id": 1,
    "parentId": null,  // 루트 노드는 null
    "name": "루트 노드",
    "customField1": "값1",
    "customField2": "값2"
  },
  {
    "id": 2,
    "parentId": 1,     // 부모 노드의 id 참조
    "name": "자식 노드 1",
    "customField1": "값3"
  },
  {
    "id": 3,
    "parentId": 1,
    "name": "자식 노드 2"
  }
]
```

#### 노드 추가/수정 요청 형식
```json
{
  "parentId": 1,      // 부모 노드 ID (루트인 경우 null)
  "name": "새 노드",
  "customData": {     // 도메인별 커스텀 데이터
    "type": "general",
    "status": "active",
    "metadata": {}
  }
}
```

#### 노드 삭제 요청 형식
```json
{
  "nodeId": 3,
  "childrenIds": [4, 5, 6]  // 하위 노드들도 함께 삭제
}
```

### 실시간 모니터링 (선택사항)

WebSocket 메시지 형식:
```json
{
  "type": "STATUS_UPDATE",
  "nodeId": 2,
  "status": {
    "connected": true,
    "lastUpdate": "2024-03-16T10:30:00Z",
    "customStatus": {}
  }
}
```

### 실제 적용 가능한 범용 데이터 구조

```json
[
  {
    "id": 1,
    "parentId": null,
    "name": "메인 노드",
    "type": 1,                    // 노드 타입 (1: 메인, 2: 일반, 3: 특수A, 4: 특수B)
    "isDisplay": true,            // 화면 표시 여부
    "metadata": {                 // 도메인별 추가 정보
      "description": "최상위 루트 노드",
      "createdAt": "2024-03-16",
      "status": "active"
    }
  },
  {
    "id": 2,
    "parentId": 1,
    "name": "서브 노드 A",
    "type": 2,
    "isDisplay": true,
    "equipment": {                // 연결된 장비나 리소스 정보 (선택)
      "result": {
        "id": "equip_001",
        "type": "DEVICE_A",
        "status": "connected",
        "lastUpdate": "2024-03-16T10:00:00Z"
      }
    }
  },
  {
    "id": 3,
    "parentId": 1,
    "name": "서브 노드 B",
    "type": 3,                    // 특수 타입 - 다른 레이아웃 적용
    "isDisplay": true,
    "specialAttributes": {        // 특수 노드용 속성
      "capacity": "100",
      "unit": "items",
      "priority": "high"
    }
  },
  {
    "id": 4,
    "parentId": 2,
    "name": "하위 노드 A-1",
    "type": 2,
    "isDisplay": true
  }
]
```

### 핵심 필드 설명

- **id**: 노드의 고유 식별자 (필수)
- **parentId**: 부모 노드 참조 (필수, 루트는 null)
- **name**: 화면에 표시될 이름 (필수)
- **type**: 노드 타입 구분 (시각적 스타일 변경용)
- **isDisplay**: 노드 표시 여부
- **equipment**: 연결된 장비/리소스 정보 (실시간 상태 모니터링용)
- **metadata/specialAttributes**: 도메인별 커스텀 데이터

이 구조는 조직도, 시스템 아키텍처, 프로세스 플로우, 카테고리 분류 등 **모든 계층적 데이터**에 적용 가능합니다.

**핵심 요구사항**:
- `id`: 고유 식별자 (필수)
- `parentId`: 부모 노드 참조 (필수, 루트는 null)
- `name`: 표시할 이름 (필수)
- 나머지 필드는 도메인에 따라 자유롭게 추가 가능

## 시각적 특징

### 레이아웃 알고리즘
- **일반 자식 노드**: 부모 노드 아래 수평으로 균등 배치
- **태양광 노드**: 오른쪽에 수직으로 배치
- **자동 간격 조정**: 서브트리 크기에 따라 자동으로 간격 계산

### 스타일링
- 노드별 그림자 효과
- 둥근 모서리 (borderRadius)
- 아이콘을 통한 타입 구분
- 상태에 따른 색상 변경

## 라이센스

현재 라이브러리화 작업중으로 라이센스는 추후 결정될 예정입니다.

## 기여

라이브러리화가 완료되면 기여 가이드라인을 제공할 예정입니다.

## 문의

프로젝트 관련 문의사항이 있으시면 이슈를 등록해주세요.