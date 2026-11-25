; ClipMitra-Setup.exe - double-click installer for people who don't want to use PowerShell.
; Build:  "%LOCALAPPDATA%\Programs\Inno Setup 6\ISCC.exe" installer\ClipMitra.iss   ->  installer\Output\
;
; The setup itself is tiny: it copies install.ps1 + start/stop scripts and runs install.ps1, which
; installs the tools (winget), downloads the latest ClipMitra from GitHub and the AI models (~4 GB).
; Per-user install, no administrator rights needed.

#define AppName "ClipMitra AI"
#define AppVersion "1.0.0"
#define AppPublisher "Nishtek"
#define AppURL "https://nishtek.in/clipmitra"

[Setup]
AppId={{6C1F2E7A-4B2D-4F0B-9D3A-C1A9E5B2D7F4}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher={#AppPublisher}
AppPublisherURL={#AppURL}
AppSupportURL=https://github.com/Nishkam-b/clipmitra
AppUpdatesURL=https://github.com/Nishkam-b/clipmitra/releases
DefaultDirName={localappdata}\ClipMitra\setup
DisableDirPage=yes
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
; Inno Setup enables Windows' RedirectionGuard by default, and child processes inherit it. uv keeps its
; Python behind a user-created junction (cpython-3.12-... -> cpython-3.12.16-...), which then fails with
; "untrusted mount point" (os error 448). This setup never elevates and only writes to the user's own
; folders, so the guard (aimed at privilege-escalation via redirected paths) adds no protection here.
RedirectionGuard=no
OutputBaseFilename=ClipMitra-Setup
OutputDir=Output
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
SetupIconFile=clipmitra.ico
UninstallDisplayIcon={app}\clipmitra.ico
UninstallDisplayName={#AppName}
LicenseFile=..\LICENSE
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
MinVersion=10.0

[Messages]
WelcomeLabel2=This will install [name] on your computer.%n%nClipMitra turns long videos into vertical, captioned clips using AI that runs on THIS computer - your videos are never uploaded.%n%nSetup downloads the tools and AI models it needs (about 4 GB). This takes about 5-15 minutes depending on your internet speed.
FinishedLabel=ClipMitra is installed.%n%nUse the ClipMitra icon on your Desktop to start it. The first time, your browser asks to allow nishtek.in to access apps on this device - choose Allow.

[Files]
Source: "..\install.ps1"; DestDir: "{app}"; Flags: ignoreversion
Source: "clipmitra.ico"; DestDir: "{app}"; Flags: ignoreversion

[Run]
Filename: "powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File ""{localappdata}\ClipMitra\app\scripts\start_clipmitra.ps1"""; Description: "Start ClipMitra now"; Flags: postinstall nowait skipifsilent

[UninstallRun]
; Stop the engine wherever ClipMitra was installed (files can't be removed while it runs).
Filename: "powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -Command ""Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue | ForEach-Object {{ $p = Get-CimInstance Win32_Process -Filter ('ProcessId=' + $_.OwningProcess); if ($p.CommandLine -match 'uvicorn\s+app\.main:app') {{ Stop-Process -Id $p.ProcessId -Force } }"""; Flags: runhidden waituntilterminated; RunOnceId: "StopEngine"

[UninstallDelete]
Type: filesandordirs; Name: "{localappdata}\ClipMitra\app"
Type: filesandordirs; Name: "{localappdata}\ClipMitra\data\models"
Type: filesandordirs; Name: "{localappdata}\ClipMitra\data\temp"
Type: files; Name: "{userdesktop}\ClipMitra.lnk"
Type: files; Name: "{userprograms}\ClipMitra.lnk"

[Code]
var
  InstallRootParam: String;
  InstallFailed: Boolean;

function InstallRoot(): String;
begin
  { /InstallRoot="C:\path" lets tests install elsewhere; normal users never pass it }
  InstallRootParam := ExpandConstant('{param:InstallRoot|}');
  if InstallRootParam = '' then
    Result := ExpandConstant('{localappdata}\ClipMitra')
  else
    Result := InstallRootParam;
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  ResultCode: Integer;
  Params: String;
begin
  if CurStep = ssPostInstall then
  begin
    WizardForm.StatusLabel.Caption := 'Installing tools and downloading the AI models (about 4 GB)...';
    WizardForm.FilenameLabel.Caption := 'A window shows the progress. Please keep it open - this can take 5-15 minutes.';
    Params := '-NoProfile -ExecutionPolicy Bypass -File "' + ExpandConstant('{app}\install.ps1') +
              '" -FromSetup -InstallRoot "' + InstallRoot() + '"';
    if ExpandConstant('{param:NoShortcuts|0}') = '1' then
      Params := Params + ' -NoShortcuts';
    if not Exec('powershell.exe', Params, '', SW_SHOWNORMAL, ewWaitUntilTerminated, ResultCode) or (ResultCode <> 0) then
    begin
      InstallFailed := True;
      SuppressibleMsgBox('ClipMitra could not finish installing (code ' + IntToStr(ResultCode) + ').' + #13#10 + #13#10 +
        'Check your internet connection and run ClipMitra-Setup again - it continues where it stopped.',
        mbError, MB_OK, IDOK);
    end;
  end;
end;

procedure CurPageChanged(CurPageID: Integer);
begin
  { Never claim success if the engine/model setup failed; don't offer to start a broken install. }
  if (CurPageID = wpFinished) and InstallFailed then
  begin
    WizardForm.FinishedHeadingLabel.Caption := 'ClipMitra is not ready yet';
    WizardForm.FinishedLabel.Caption := 'Some downloads did not finish. Check your internet connection and run ' +
      'ClipMitra-Setup again - it reuses everything already downloaded.';
    WizardForm.RunList.Visible := False;
  end;
end;

function GetCustomSetupExitCode: Integer;
begin
  if InstallFailed then Result := 2 else Result := 0;  { lets silent/test runs detect failure }
end;

procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
begin
  if CurUninstallStep = usPostUninstall then
    if DirExists(ExpandConstant('{localappdata}\ClipMitra\data')) then
      if SuppressibleMsgBox('Also delete your ClipMitra videos and clips?' + #13#10 +
         ExpandConstant('{localappdata}\ClipMitra\data'), mbConfirmation, MB_YESNO, IDNO) = IDYES then
        DelTree(ExpandConstant('{localappdata}\ClipMitra'), True, True, True);
end;
