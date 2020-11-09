import sys
f = open("postleitzahlen-deutschland.geojson","r+")
s = f.read()
#s = "Wei\u00c3\u009fenborn, Obersch\u00c3\u00b6na"
s = s.encode('latin1').decode('unicode-escape').encode('latin1').decode('utf-8')
#sys.stdout.buffer.write(s)

f.seek(0)
f.truncate()
f.write(s)
f.close()
