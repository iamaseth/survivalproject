#!/usr/bin/env python3
"""Lossless offline import of BoBo TikTok Markdown to SQLite; no live CRM writes."""
import argparse,hashlib,json,re,sqlite3,zipfile
from pathlib import Path
SCHEMA="""
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS creators(id INTEGER PRIMARY KEY,handle TEXT UNIQUE COLLATE NOCASE,profile_url TEXT);
CREATE TABLE IF NOT EXISTS captures(id INTEGER PRIMARY KEY,creator_id INTEGER REFERENCES creators(id),sha256 TEXT UNIQUE,source_file TEXT,captured_at TEXT,raw_md TEXT,parsed_json TEXT,imported_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS profile_snapshots(capture_id INTEGER PRIMARY KEY REFERENCES captures(id),bio TEXT,followers TEXT,following TEXT,likes TEXT,emails TEXT,quality_json TEXT);
CREATE TABLE IF NOT EXISTS videos(id INTEGER PRIMARY KEY,creator_id INTEGER REFERENCES creators(id),url TEXT UNIQUE,video_id TEXT);
CREATE TABLE IF NOT EXISTS video_observations(video_id INTEGER REFERENCES videos(id),capture_id INTEGER REFERENCES captures(id),caption TEXT,thumbnail TEXT,raw_label TEXT,PRIMARY KEY(video_id,capture_id));
CREATE TABLE IF NOT EXISTS hashtags(video_id INTEGER REFERENCES videos(id),tag TEXT COLLATE NOCASE,PRIMARY KEY(video_id,tag));
CREATE TABLE IF NOT EXISTS evidence(capture_id INTEGER REFERENCES captures(id),kind TEXT,value TEXT,PRIMARY KEY(capture_id,kind,value));
CREATE TABLE IF NOT EXISTS ai_reviews(id INTEGER PRIMARY KEY,creator_id INTEGER REFERENCES creators(id),capture_id INTEGER REFERENCES captures(id),decision TEXT CHECK(decision IN ('ai_screened','second_look','rejected')),confidence TEXT,rationale TEXT,rubric_version TEXT,model TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS human_decisions(id INTEGER PRIMARY KEY,creator_id INTEGER REFERENCES creators(id),decision TEXT,reviewer TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS import_errors(source_file TEXT,error TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
"""
def field(text,label):
 m=re.search(r'^- '+re.escape(label)+r':\s*(.*)$',text,re.M|re.I)
 return m.group(1).strip() if m else None
def parse(md):
 meta={}
 head=re.match(r'^---\s*\n(.*?)\n---\s*\n',md,re.S)
 if head:
  for line in head.group(1).splitlines():
   if ':' in line:
    k,v=line.split(':',1);meta[k.strip()]=v.strip().strip('"')
 match=re.search(r'tiktok\.com/@([\w.]+)',meta.get('source','')+'\n'+md,re.I)
 if not match:raise ValueError('No TikTok profile handle')
 handle=match.group(1).lower()
 def section(title):
  m=re.search(r'^## '+title+r'[^\n]*\n(.*?)(?=\n## |\Z)',md,re.S|re.M|re.I)
  return m.group(1).strip() if m else ''
 parts=re.split(r'^### \d+\. \[Open TikTok video\]\((https?://[^)]+)\)\s*$',md,flags=re.M)
 videos=[{'url':parts[i],'caption':field(parts[i+1],'Caption'),'thumbnail':field(parts[i+1],'Thumbnail URL (may expire)'),'label':field(parts[i+1],'Raw visible alt/label')} for i in range(1,len(parts),2) if re.search(r'/video/\d+',parts[i])]
 return {'handle':handle,'url':f'https://www.tiktok.com/@{handle}','meta':meta,'bio':section('Bio'),'followers':field(md,'Followers'),'following':field(md,'Following'),'likes':field(md,'Likes'),'emails':field(md,'Emails shown'),'quality':{k:field(md,k) for k in ['Videos with links','Captions available','Caption-only cards without links']},'videos':videos,'hashtags':sorted(set(re.findall(r'#[\w]+',section('Hashtags found')))),'commercial':section('Possible commercial signals'),'tagged_accounts':section('Tagged accounts')}
def ingest(db,name,md):
 p=parse(md);digest=hashlib.sha256(md.encode()).hexdigest()
 if db.execute('SELECT 1 FROM captures WHERE sha256=?',(digest,)).fetchone():return 'duplicate'
 db.execute('INSERT INTO creators(handle,profile_url) VALUES (?,?) ON CONFLICT(handle) DO UPDATE SET profile_url=excluded.profile_url',(p['handle'],p['url']))
 cid=db.execute('SELECT id FROM creators WHERE handle=?',(p['handle'],)).fetchone()[0]
 cur=db.execute('INSERT INTO captures(creator_id,sha256,source_file,captured_at,raw_md,parsed_json) VALUES (?,?,?,?,?,?)',(cid,digest,name,p['meta'].get('captured'),md,json.dumps(p)))
 cap=cur.lastrowid
 db.execute('INSERT INTO profile_snapshots VALUES (?,?,?,?,?,?,?)',(cap,p['bio'],p['followers'],p['following'],p['likes'],p['emails'],json.dumps(p['quality'])))
 for v in p['videos']:
  vid=re.search(r'/video/(\d+)',v['url']).group(1)
  db.execute('INSERT OR IGNORE INTO videos(creator_id,url,video_id) VALUES (?,?,?)',(cid,v['url'],vid))
  row=db.execute('SELECT id FROM videos WHERE url=?',(v['url'],)).fetchone()[0]
  db.execute('INSERT OR IGNORE INTO video_observations VALUES (?,?,?,?,?)',(row,cap,v['caption'],v['thumbnail'],v['label']))
  for tag in set(re.findall(r'#[\w]+',v['caption'] or '')):db.execute('INSERT OR IGNORE INTO hashtags VALUES (?,?)',(row,tag))
 for tag in p['hashtags']:db.execute('INSERT OR IGNORE INTO evidence VALUES (?,?,?)',(cap,'profile_hashtag',tag))
 for kind in ('commercial','tagged_accounts'):
  if p[kind]:db.execute('INSERT OR IGNORE INTO evidence VALUES (?,?,?)',(cap,kind,p[kind]))
 return 'imported'
def inputs(paths):
 for path in paths:
  p=Path(path)
  if p.is_dir():yield from inputs(sorted(p.rglob('*.md')))
  elif p.suffix.lower()=='.zip':
   with zipfile.ZipFile(p) as z:
    for i in z.infolist():
     if i.filename.lower().endswith('.md') and not i.is_dir() and i.file_size<10000000:
      yield f'{p.name}:{i.filename}',z.read(i).decode('utf-8-sig')
  elif p.suffix.lower()=='.md':yield str(p),p.read_text(encoding='utf-8-sig')
def main():
 a=argparse.ArgumentParser();a.add_argument('inputs',nargs='+');a.add_argument('--db',default='influencer-research.sqlite');a.add_argument('--dry-run',action='store_true');args=a.parse_args()
 db=sqlite3.connect(':memory:' if args.dry_run else args.db);db.executescript(SCHEMA);stats={'imported':0,'duplicate':0,'error':0}
 for name,md in inputs(args.inputs):
  try:
   with db:status=ingest(db,name,md)
   stats[status]+=1
  except Exception as e:
   stats['error']+=1
   with db:db.execute('INSERT INTO import_errors VALUES (?,?,CURRENT_TIMESTAMP)',(name,str(e)))
   print('ERROR',name,str(e))
 print(json.dumps(stats));print('creators',db.execute('SELECT count(*) FROM creators').fetchone()[0],'videos',db.execute('SELECT count(*) FROM videos').fetchone()[0]);db.close()
if __name__=='__main__':main()
