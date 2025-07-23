@echo off
REM Garantir que o script execute no diretorio onde o .bat se encontra:
cd /d "%~dp0"

echo =====================================
echo Instalando dependencias do projeto...
echo =====================================
call npm install
IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERRO] Falha ao instalar as dependências do projeto.
    goto :END
)

echo.
echo =====================================
echo Dependencias instaladas com sucesso!
echo Iniciando o servidor WhatsApp Web...
echo =====================================
node enviar_whatsapp.js
IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERRO] Falha ao iniciar o servidor WhatsApp Web.
    goto :END
)

:END
echo.
echo (Processo concluido. Pressione qualquer tecla para finalizar...)
pause >nul
