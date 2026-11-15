
import cv2, torch, torch.nn as nn, torch.nn.functional as F

CLASSES = ['Caries', 'Impacted', 'Filling', 'Implant', 'Periapical Lesion', 'Deep Caries', 'Bone Loss', 'Fracture']
IMG_W, IMG_H = 768, 384

def cbr(ci, co, k=3, s=1):
    return nn.Sequential(nn.Conv2d(ci, co, k, s, k // 2, bias=False), nn.BatchNorm2d(co), nn.SiLU(inplace=True))

class Res(nn.Module):
    def __init__(self, ci, co, stride=1):
        super().__init__()
        self.c1 = cbr(ci, co, 3, stride)
        self.c2 = nn.Sequential(nn.Conv2d(co, co, 3, 1, 1, bias=False), nn.BatchNorm2d(co))
        self.sk = nn.Identity() if (ci == co and stride == 1) else nn.Sequential(
            nn.Conv2d(ci, co, 1, stride, bias=False), nn.BatchNorm2d(co))
        self.act = nn.SiLU(inplace=True)
    def forward(self, x):
        return self.act(self.c2(self.c1(x)) + self.sk(x))

def stage(ci, co, n, stride):
    return nn.Sequential(Res(ci, co, stride), *[Res(co, co) for _ in range(n - 1)])

class DentalNet(nn.Module):
    def __init__(self, ncls, ch=(64, 128, 256, 384), neck=128):
        super().__init__()
        self.stem = nn.Sequential(cbr(1, 32, 3, 2), cbr(32, 32, 3, 1))
        self.s1 = stage(32, ch[0], 2, 2)
        self.s2 = stage(ch[0], ch[1], 2, 2)
        self.s3 = stage(ch[1], ch[2], 3, 2)
        self.s4 = stage(ch[2], ch[3], 2, 2)
        self.lat = nn.ModuleList([nn.Conv2d(c, neck, 1) for c in ch])
        self.smooth = cbr(neck, neck, 3, 1)
        def head(cout, bias):
            m = nn.Sequential(nn.Conv2d(neck, 64, 3, 1, 1), nn.SiLU(inplace=True), nn.Conv2d(64, cout, 1))
            nn.init.constant_(m[-1].bias, bias)
            return m
        self.hm = head(ncls, -2.19)
        self.wh = head(2, 3.0)
        self.off = head(2, 0.0)
    def forward(self, x):
        c2 = self.s1(self.stem(x)); c3 = self.s2(c2); c4 = self.s3(c3); c5 = self.s4(c4)
        p = self.lat[3](c5)
        p = F.interpolate(p, size=c4.shape[-2:], mode='nearest') + self.lat[2](c4)
        p = F.interpolate(p, size=c3.shape[-2:], mode='nearest') + self.lat[1](c3)
        p = F.interpolate(p, size=c2.shape[-2:], mode='nearest') + self.lat[0](c2)
        p = self.smooth(p)
        return self.hm(p), self.wh(p), self.off(p)

@torch.no_grad()
def decode(hm_o, wh_o, off_o, stride=4, K=100, thr=0.3):
    hm = torch.sigmoid(hm_o.float())
    hm = hm * (F.max_pool2d(hm, 3, 1, 1) == hm).float()
    B, C, H, W = hm.shape
    sc, idx = hm.view(B, -1).topk(K)
    cls = idx // (H * W); pix = idx % (H * W); ys = pix // W; xs = pix % W
    out = []
    for b in range(B):
        w = wh_o[b, 0][ys[b], xs[b]].float().clamp(max=8).exp()
        h = wh_o[b, 1][ys[b], xs[b]].float().clamp(max=8).exp()
        cx = (xs[b] + off_o[b, 0][ys[b], xs[b]].float()) * stride
        cy = (ys[b] + off_o[b, 1][ys[b], xs[b]].float()) * stride
        boxes = torch.stack([cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2], 1)
        m = sc[b] > thr
        out.append((boxes[m], sc[b][m], cls[b][m]))
    return out

class DentalDetector:
    def __init__(self, weights_path, device=None):
        self.device = device or ('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = DentalNet(len(CLASSES)).to(self.device)
        self.model.load_state_dict(torch.load(weights_path, map_location=self.device, weights_only=True))
        self.model.eval()

    @torch.no_grad()
    def predict(self, image_path, thr=0.3):
        img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
        if img is None:
            raise ValueError('Image nahi khuli: ' + str(image_path))
        h0, w0 = img.shape
        x = cv2.resize(img, (IMG_W, IMG_H), interpolation=cv2.INTER_AREA)
        x = torch.from_numpy(x).float().div(255.0)[None, None].to(self.device)
        hm, wh, off = self.model(x)
        boxes, scores, cls = decode(hm, wh, off, thr=thr)[0]
        sx, sy = w0 / IMG_W, h0 / IMG_H
        res = []
        for (x1, y1, x2, y2), s, c in zip(boxes.tolist(), scores.tolist(), cls.tolist()):
            res.append({'class': CLASSES[c], 'confidence': round(s, 4),
                        'bbox': [max(0, x1 * sx), max(0, y1 * sy), min(w0, x2 * sx), min(h0, y2 * sy)]})
        return res

    @torch.no_grad()
    def predict_bytes(self, img_bytes, thr=0.3):
        """Predict from raw image bytes (uploaded file)."""
        import numpy as np
        arr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_GRAYSCALE)
        if img is None:
            raise ValueError('Image decode failed from bytes')
        h0, w0 = img.shape
        x = cv2.resize(img, (IMG_W, IMG_H), interpolation=cv2.INTER_AREA)
        x = torch.from_numpy(x).float().div(255.0)[None, None].to(self.device)
        hm, wh, off = self.model(x)
        boxes, scores, cls = decode(hm, wh, off, thr=thr)[0]
        sx, sy = w0 / IMG_W, h0 / IMG_H
        res = []
        for (x1, y1, x2, y2), s, c in zip(boxes.tolist(), scores.tolist(), cls.tolist()):
            res.append({'class': CLASSES[c], 'confidence': round(s, 4),
                        'bbox': [int(max(0, x1 * sx)), int(max(0, y1 * sy)),
                                 int(min(w0, x2 * sx)), int(min(h0, y2 * sy))]})
        return res
