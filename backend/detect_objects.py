import sys
import json
from pathlib import Path

import numpy as np
import torch
import timm
from PIL import Image
import torchvision.transforms as T
from torchvision.models import ResNet50_Weights

# YOLOv8
from ultralytics import YOLO

# Detectron2
from detectron2.config import get_cfg
from detectron2.engine import DefaultPredictor
from detectron2 import model_zoo
from detectron2.data import MetadataCatalog

# =======================
# CONFIG
# =======================
DEVICE = "cpu"

YOLO_MODEL = "yolov8s.pt"
YOLO_CONF = 0.25
MIN_BOX_RATIO = 0.005
YOLO_ANIMAL_IDS = {14,15,16,17,18,19,20,21,22,23}

CLASSIFIER_THRESHOLD = 0.20
DETECTRON_CONF = 0.5
DETECTRON_CLASSES = [
    "person","bicycle","car","motorcycle","airplane","bus","train",
    "truck","boat","traffic light","fire hydrant","stop sign",
    "parking meter","bench","bird","cat","dog","horse","sheep",
    "cow","elephant","bear","zebra","giraffe"
]

ANIMAL_KEYWORDS = [
    "dog","cat","horse","cow","sheep","bear","zebra","giraffe",
    "deer","fox","wolf","boar","elk","moose","lion","tiger","bird"
]

# =======================
# YOLOv8 SETUP
# =======================
yolo = YOLO(YOLO_MODEL)

# =======================
# Detectron2 SETUP
# =======================
cfg = get_cfg()
cfg.merge_from_file(model_zoo.get_config_file("COCO-InstanceSegmentation/mask_rcnn_R_50_FPN_3x.yaml"))
cfg.MODEL.ROI_HEADS.SCORE_THRESH_TEST = DETECTRON_CONF
cfg.MODEL.DEVICE = DEVICE
cfg.MODEL.WEIGHTS = model_zoo.get_checkpoint_url("COCO-InstanceSegmentation/mask_rcnn_R_50_FPN_3x.yaml")
detectron_predictor = DefaultPredictor(cfg)
metadata = MetadataCatalog.get(cfg.DATASETS.TRAIN[0])

# =======================
# CLASSIFIER SETUP
# =======================
clf = timm.create_model("resnet50", pretrained=True)
clf.eval()
clf.to(DEVICE)
IMAGENET_LABELS = ResNet50_Weights.IMAGENET1K_V1.meta["categories"]

transform = T.Compose([
    T.Resize(256),
    T.CenterCrop(224),
    T.ToTensor(),
    T.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

def load_image_array(image_path: str) -> np.ndarray:
    path = Path(image_path)
    if not path.exists():
        raise ValueError("Image introuvable ou illisible")
    with Image.open(path).convert("RGB") as pil_image:
        return np.array(pil_image)


# =======================
# YOLO DETECTION
# =======================
def detect_yolo(image_path: str):
    results = yolo(image_path, conf=YOLO_CONF, device=DEVICE)
    animals = []

    for r in results:
        h, w = r.orig_shape[:2]
        img_area = float(h * w) if h and w else 1.0
        for box in r.boxes:
            cls_id = int(box.cls[0])
            if cls_id not in YOLO_ANIMAL_IDS:
                continue
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            box_area = max((x2 - x1), 0) * max((y2 - y1), 0)
            if (box_area / img_area) < MIN_BOX_RATIO:
                continue
            animals.append({
                "class": yolo.names[cls_id],
                "confidence": float(box.conf[0]),
                "bbox": (x1, y1, x2, y2)
            })
    return animals

# =======================
# DETECTRON2 DETECTION
# =======================
def detect_detectron(image_path: str):
    rgb_img = load_image_array(image_path)
    # Detectron2 attend des images BGR
    img = rgb_img[:, :, ::-1].copy()
    outputs = detectron_predictor(img)
    instances = outputs["instances"]
    boxes = instances.pred_boxes if instances.has("pred_boxes") else None
    scores = instances.scores if instances.has("scores") else None
    classes = instances.pred_classes if instances.has("pred_classes") else None

    animals = []
    if boxes is not None:
        for i, cls_id in enumerate(classes):
            label = metadata.thing_classes[cls_id]
            if label.lower() not in ANIMAL_KEYWORDS:
                continue
            if float(scores[i]) < DETECTRON_CONF:
                continue
            bbox = boxes[i].tensor.cpu().numpy().tolist()[0]
            animals.append({
                "class": label,
                "confidence": float(scores[i]),
                "bbox": bbox
            })
    return animals

# =======================
# GLOBAL ANALYSIS
# =======================

def analyze(image_path):
    path = Path(image_path)
    if not path.exists():
        raise ValueError("Image introuvable ou illisible")
    image_path = str(path)

    # 1️⃣ YOLO
    yolo_animals = detect_yolo(image_path)
    if yolo_animals:
        return {"animal_present": True, "method":"yolo", "count":len(yolo_animals), "details": yolo_animals}

    # 2️⃣ Detectron2
    detectron_animals = detect_detectron(image_path)
    if detectron_animals:
        # on garde le classifier comme score secondaire mais pas pour annuler la détection
        score = classify_image(image_path)
        return {"animal_present": True, "method":"detectron2", "count":len(detectron_animals), "details":detectron_animals, "classifier_score": score}

    # 3️⃣ Classifier seul
    score = classify_image(image_path)
    if score >= CLASSIFIER_THRESHOLD:
        return {"animal_present": True, "method":"classifier", "count":1, "score":score}

    return {"animal_present": False, "method":None, "count":0}


# =======================
# IMAGE CLASSIFIER
# =======================
def classify_image(image_path):
    img = Image.open(image_path).convert("RGB")
    x = transform(img).unsqueeze(0).to(DEVICE)
    with torch.no_grad():
        logits = clf(x)
        probs = torch.softmax(logits, dim=1)[0]
    topk = torch.topk(probs, 10)
    score = 0.0
    for idx, p in zip(topk.indices, topk.values):
        label = IMAGENET_LABELS[idx].lower()
        if any(k in label for k in ANIMAL_KEYWORDS):
            score += float(p)
    return score

## =======================
# MAIN
# =======================
if __name__=="__main__":
    if len(sys.argv)!=2:
        print(json.dumps({"error": "Usage: python detect_objects.py image.jpg"}))
        sys.exit(1)
    try:
        result = analyze(sys.argv[1])
        print(json.dumps(result))
    except Exception as error:
        print(json.dumps({"error": str(error)}))
        sys.exit(1)
