Instalación en producción (Ubuntu/Debian):

1. Crear usuario y rutas:
   sudo adduser --system --group globetrek
   sudo mkdir -p /srv/globetrek
   sudo chown -R globetrek:globetrek /srv/globetrek

2. Copiar proyecto y crear venv:
   rsync -a backend/ /srv/globetrek/backend/
   python3 -m venv /srv/globetrek/venv
   /srv/globetrek/venv/bin/pip install -r /srv/globetrek/backend/requirements.txt

3. Configurar entorno:
   sudo cp deploy/example/globetrek-backend.env /etc/globetrek-backend.env
   sudo chown root:root /etc/globetrek-backend.env
   sudo chmod 0640 /etc/globetrek-backend.env

4. Instalar servicios:
   sudo cp deploy/systemd/globetrek-backend.service /etc/systemd/system/
   sudo cp deploy/systemd/globetrek-backend-monitor.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable globetrek-backend.service globetrek-backend-monitor.service
   sudo systemctl start globetrek-backend.service
   sudo systemctl status globetrek-backend.service

5. Logs:
   journalctl -u globetrek-backend.service -f
   ls /srv/globetrek/backend/logs/app.log

6. Salud:
   curl http://127.0.0.1:8000/health/

Mantenimiento:
- Reinicio suave: sudo systemctl reload globetrek-backend.service
- Reinicio: sudo systemctl restart globetrek-backend.service
- Actualización de código: detener, sincronizar, reinstalar requirements si cambian, migraciones: /srv/globetrek/venv/bin/python /srv/globetrek/backend/manage.py migrate
