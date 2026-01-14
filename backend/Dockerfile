FROM node:20-bullseye

WORKDIR /app

# System dependencies for Python + Detectron2
RUN apt-get update \
	&& apt-get install -y --no-install-recommends \
		python3 \
		python3-pip \
		python3-dev \
		build-essential \
		git \
		libgl1 \
		libglib2.0-0 \
	&& rm -rf /var/lib/apt/lists/*

# Install Python dependencies used by detect_objects.py
COPY requirements.txt /tmp/requirements.txt
RUN python3 -m pip install --upgrade pip \
	&& python3 -m pip install --no-cache-dir torch==2.2.1 torchvision==0.17.1 torchaudio==2.2.1 \
	&& python3 -m pip install --no-cache-dir --no-build-isolation -r /tmp/requirements.txt

# Install Node.js dependencies
COPY package.json ./
RUN npm install --production

# Copy application source
COPY . /app

ENV PYTHON_BIN=python3

EXPOSE 3001

CMD ["npm", "start"]