<?php
declare(strict_types=1);
function audiovisualLibrary(): array {
    $groups=[];
    foreach(query("SELECT setting_key, setting_value FROM site_settings WHERE LEFT(setting_key,3) = 'av_' ORDER BY setting_key")->fetchAll() as $row) {
        if(preg_match('/^av_([a-f0-9]{32})_[0-9]{5}$/D',$row['setting_key'],$match)) $groups[$match[1]]=($groups[$match[1]]??'').$row['setting_value'];
    }
    $records=[];
    foreach($groups as $encoded) $records[]=json_decode(base64_decode($encoded,true),true,16,JSON_THROW_ON_ERROR);
    return $records;
}
function writeAudiovisual(array $record): void {
    $prefix='av_'.$record['id'].'_';
    query('DELETE FROM site_settings WHERE LEFT(setting_key,36) = ?',[$prefix]);
    foreach(str_split(base64_encode(json_encode($record,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR)),240) as $index=>$chunk) query('INSERT INTO site_settings (setting_key,setting_value) VALUES (?,?)',[$prefix.sprintf('%05d',$index),$chunk]);
}
function audiovisualRecord(string $id): ?array { foreach(audiovisualLibrary() as $record) if($record['id']===$id)return $record;return null; }
function renameAudiovisual(array $data): array {
    $id=$data['id']??'';$title=$data['title']??'';
    if(!is_string($id)||!preg_match('/^[a-f0-9]{32}$/D',$id)||!is_string($title)||strlen($title)>2000)throw new ApiError('Invalid media details.');
    db()->beginTransaction();try{query("SELECT setting_key FROM site_settings WHERE setting_key='admin_bootstrap' FOR UPDATE");$record=audiovisualRecord($id);if(!$record)throw new ApiError('Media not found.',404);$record['title']=$title;writeAudiovisual($record);db()->commit();return ['ok'=>true];}catch(Throwable $error){db()->rollBack();throw $error;}
}
function audiovisualUrl(array $record): string { return '/api/index.php?action=library-media&id='.$record['id'].'&v='.substr(hash('sha256',$record['url']),0,16); }
function serveAudiovisual(): never {
    $id=$_GET['id']??'';
    if(!is_string($id)||!preg_match('/^[a-f0-9]{32}$/D',$id))throw new ApiError('Media not found.',404);
    $record=audiovisualRecord($id);
    if(!$record||!in_array('av:'.$id,websiteSettings()['config']['media']??[],true))throw new ApiError('Media not found.',404);
    if(!preg_match('~^storage://([a-f0-9]{32}\.(mp4|webm|mp3|ogg))$~D',$record['url'],$match))throw new ApiError('Media not found.',404);
    serveWebsiteFile($match[1]);
}
function deleteAudiovisual(array $data): array {
    $id=$data['id']??'';if(!is_string($id)||!preg_match('/^[a-f0-9]{32}$/D',$id))throw new ApiError('Media not found.',404);
    db()->beginTransaction();
    try {
        query("SELECT setting_key FROM site_settings WHERE setting_key='admin_bootstrap' FOR UPDATE");
        if(in_array('av:'.$id,websiteSettings()['config']['media']??[],true))throw new ApiError('This media is used on the website. Choose a replacement before deleting it.');
        $record=audiovisualRecord($id);query('DELETE FROM site_settings WHERE LEFT(setting_key,36) = ?',['av_'.$id.'_']);db()->commit();
    } catch(Throwable $error){db()->rollBack();throw $error;}
    if($record&&preg_match('~^storage://([a-f0-9]{32}\.(mp4|webm|mp3|ogg))$~D',$record['url'],$match)) { $file=storageDirectory().'/'.$match[1];if(is_file($file))unlink($file); }
    return ['ok'=>true];
}
function importAudiovisual(): array {
    $root=realpath(getenv('SITE_PUBLIC_MEDIA_PATH')?:dirname(__DIR__));
    $sources=['/videos/news-1.mp4'=>'News video 1','/videos/news-2.mp4'=>'News video 2','/videos/news-3.mp4'=>'News video 3','/mp3/Bijan%20Mortazavi.mp3'=>'Bijan Mortazavi'];
    $created=[];$count=0;db()->beginTransaction();
    try {
        query("SELECT setting_key FROM site_settings WHERE setting_key='admin_bootstrap' FOR UPDATE");
        $config=websiteSettings()['config'];$config['languages']??=['en'=>true,'sv'=>true,'default'=>'en'];
        foreach($sources as $source=>$title){
            $mapping='avsrc_'.substr(hash('sha256',$source),0,48);
            if(query('SELECT 1 FROM site_settings WHERE setting_key=?',[$mapping])->fetchColumn())continue;
            $current=$config['media'][$source]??$source;
            if(str_starts_with($current,'av:'))continue;
            $file=str_starts_with($current,'storage://')?realpath(storageDirectory().'/'.substr($current,10)):($root?realpath($root.'/'.rawurldecode(ltrim($current,'/'))):false);
            if(!$file||!is_file($file)||is_link($file))continue;
            if(!str_starts_with($current,'storage://')&&!str_starts_with(strtolower(str_replace('\\','/',$file)),strtolower(str_replace('\\','/',$root)).'/'))continue;
            $extension=strtolower(pathinfo($file,PATHINFO_EXTENSION));if(!in_array($extension,['mp4','webm','mp3','ogg'],true))continue;
            $name=bin2hex(random_bytes(16)).'.'.$extension;$target=storageDirectory().'/'.$name;
            if(!copy($file,$target))throw new ApiError('Could not import media.');chmod($target,0600);$created[]=$target;
            $id=bin2hex(random_bytes(16));writeAudiovisual(['id'=>$id,'title'=>$title,'url'=>'storage://'.$name,'type'=>in_array($extension,['mp4','webm'],true)?'video':'audio']);
            $config['media'][$source]='av:'.$id;query('INSERT INTO site_settings (setting_key,setting_value) VALUES (?,?)',[$mapping,$id]);$count++;
        }
        query("INSERT INTO site_settings (setting_key,setting_value) VALUES ('av_library_initialized','1') ON DUPLICATE KEY UPDATE setting_value='1'");
        writeWebsiteDocument($config);db()->commit();return ['imported'=>$count];
    }catch(Throwable $error){db()->rollBack();foreach($created as $file)if(is_file($file))unlink($file);throw $error;}
}
