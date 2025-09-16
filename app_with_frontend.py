from flask import Flask, send_from_directory
import os
from app import app as main_app

@main_app.route('/', defaults={'path': ''})
@main_app.route('/<path:path>')
def serve_frontend(path):
    if path != '' and os.path.exists(os.path.join('/app/static', path)):
        return send_from_directory('/app/static', path)
    else:
        return send_from_directory('/app/static', 'index.html')

if __name__ == '__main__':
    main_app.run(host='0.0.0.0', port=5000, debug=False)


