"""WCAG 2.x contrast check for every text/background pair used in the mockup."""
def L(h):
    h=h.lstrip('#');c=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    c=[x/12.92 if x<=0.03928 else ((x+0.055)/1.055)**2.4 for x in c]
    return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2]
def cr(a,b):
    la,lb=sorted([L(a),L(b)],reverse=True);return (la+0.05)/(lb+0.05)
TEXT=[('ink #0E0F11','white #FFFFFF'),('ink #0E0F11','surface #F4F5F7'),('graphite #3D4249','white #FFFFFF'),('graphite #3D4249','surface #F4F5F7'),
('muted #5C636D','white #FFFFFF'),('muted #5C636D','surface #F4F5F7'),('muted #5C636D','quote-foot #FBFBFC'),
('red-text #CC0000','white #FFFFFF'),('red-text #CC0000','surface #F4F5F7'),('red-text #CC0000','down-tint #FDECEC'),
('white #FFFFFF','red-text #CC0000'),('white #FFFFFF','red-press #A3000C'),('white #FFFFFF','ink #0E0F11'),('white #FFFFFF','graphite #3D4249'),
('on-dark-muted #A9B0BA','ink #0E0F11'),('hero-body #D5D9DF','ink #0E0F11'),
('up #0A7A3E','white #FFFFFF'),('up #0A7A3E','up-tint #E7F4EC'),('down #CC0000','white #FFFFFF'),
('ink #0E0F11','flag #FFD84D'),('ink #0E0F11','flag-tint #FFF6D1'),('graphite #3D4249','flag-tint #FFF6D1'),('ink #0E0F11','white@96% header #FFFFFF')]
NONTEXT=[('red #FF0000','white #FFFFFF'),('red #FF0000','surface #F4F5F7'),('red #FF0000','ink #0E0F11'),('bar #8A919B','white #FFFFFF'),('ink rule #0E0F11','white #FFFFFF'),('focus #FF0000','white #FFFFFF')]
if __name__=='__main__':
    print('| Foreground | Background | Ratio | AA normal (4.5) | AA large/UI (3.0) |\n|---|---|---|---|---|')
    for f,b in TEXT:
        r=cr(f.split()[-1],b.split()[-1]); print(f'| {f} | {b} | {r:.2f}:1 | {"pass" if r>=4.5 else "FAIL"} | {"pass" if r>=3 else "FAIL"} |')
    print('\nNon-text (WCAG 1.4.11, needs 3:1):\n\n| Element | Against | Ratio | 3:1 |\n|---|---|---|---|')
    for f,b in NONTEXT:
        r=cr(f.split()[-1],b.split()[-1]); print(f'| {f} | {b} | {r:.2f}:1 | {"pass" if r>=3 else "FAIL"} |')
