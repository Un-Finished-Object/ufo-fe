# 실행 방법

## Windows

### 1) 필수 프로그램 설치

#### A. Node.js 설치

명령 프롬프트나 PowerShell을 실행한 후 아래 명령어를 실행하세요.
```bash
# Chocolatey 다운로드 및 설치:
powershell -c "irm https://community.chocolatey.org/install.ps1|iex"
# Node.js 다운로드 및 설치:
choco install nodejs-lts --version="24"
# Node.js 버전 확인:
node -v # "v24.13.1"가 출력되어야 합니다.
# Verify the Node.js version:
node -v # Should print "v24.13.1".
```

다음과 같이 버전이 출력되면 설치 완료
```bash
node -v
v24.13.1
```

#### B. pnpm 설치

명령 프롬프트나 PowerShell을 실행한 후 아래 명령어를 실행하세요.

```bash
# pnpm 다운로드 및 설치:
corepack enable pnpm
# pnpm 버전 확인:
pnpm -v
```

다음과 같이 버전이 출력되면 설치 완료
```bash
pnpm -v
10.25.0
```

### 2) 프로젝트 폴더 열기

명령 프롬프트에서 프로젝트 폴더로 이동하세요.

```bash
cd C:\path\to\ufo-frontend
```

`C:\path\to\ufo-frontend` 부분은 실제 경로로 바꿔주세요.

### 3) 프로젝트 의존성 설치

아래 명령어를 실행하세요.

```bash
pnpm install
```

### 4) 개발 서버 실행

아래 명령어를 실행하세요.

```bash
pnpm dev
```

실행 후 브라우저에서 아래 주소를 열어주세요.

http://localhost:3000

### 5) 서버 종료

명령 프롬프트에서 아래 키를 누르세요.

```text
Ctrl + C
```

## macOS

### 1) 필수 프로그램 설치

#### A. Node.js 설치

터미널을 열고 아래 명령어를 실행하세요.

```bash
# nvm 다운로드 및 설치:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
# Node.js 다운로드 및 설치:
nvm install 24
# Node.js 버전 확인:
node -v # "v24.13.1"가 출력되어야 합니다.
nvm current # "v24.13.1"가 출력되어야 합니다.
# Verify the Node.js version:
node -v # Should print "v24.13.1".
```

다음과 같이 버전이 출력되면 설치 완료
```bash
node -v
v24.13.1
```

#### B. pnpm 설치

터미널에 아래 명령어를 실행하세요.

```bash
# pnpm 다운로드 및 설치:
corepack enable pnpm
# pnpm 버전 확인:
pnpm -v
```

다음과 같이 버전이 출력되면 설치 완료
```bash
pnpm -v
10.25.0
```

### 2) 프로젝트 폴더 열기

터미널에서 프로젝트 폴더로 이동하세요.

```bash
cd /path/to/ufo-frontend
```

`/path/to/ufo-frontend` 부분은 실제 경로로 바꿔주세요.

### 3) 프로젝트 의존성 설치

아래 명령어를 실행하세요.

```bash
pnpm install
```

### 4) 개발 서버 실행

아래 명령어를 실행하세요.

```bash
pnpm dev
```

실행 후 브라우저에서 아래 주소를 열어주세요.

http://localhost:3000

### 5) 서버 종료

터미널에서 아래 키를 누르세요.

```text
Control + C
```
