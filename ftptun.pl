#!/usr/bin/perl

use strict;
use LWP::UserAgent;
use Getopt::Long;
use Pod::Usage;
use URI::URL;

##### Global var #####
my $browser = LWP::UserAgent->new();
$browser->env_proxy();
$browser->agent("curl/7.35.0");

my %opt = ( csize => "5M",
	    fileURL => "" );

GetOptions( \%opt, "csize=s", "-out=s", "fielURL=s", "man", "help" ) || pod2usage(2);

##### Function #######
sub checkOpt () {
	pod2usage( -exitstatus => 1, -verbose => 0 ) if( ! $ARGV[0] );
	$opt{fileURL} = $ARGV[0];

	if ( ! $opt{out} ) {
		my $uri = URI->new( $opt{fileURL} );
		
		my @tmp = split("/",$uri->path());
		$opt{out} = pop @tmp;
	}

	$opt{csize} =~ s/M|m$//;
	$opt{csize} = $opt{csize} * 1024000;
}

sub openLFile () {
	open( $opt{ofs} ,"> $opt{out}") || die "SYS ERROR: $!";	
}

sub closeLFile () {
	close($opt{ofs}) || die "SYS ERROR: $!";
}

sub getFileSize {
	my $reqURL = new URI::URL($opt{fileURL});
	my $postBody = '{ "method": "HEAD" , "hostname": "'.$reqURL->host().'", "path": "'.$reqURL->path().'" }';

	my $req = HTTP::Request->new( POST => "http://127.0.0.1:1337/" );
	$req->header( 'Content-Type' => 'application/json' );
	$req->content( $postBody );
	my $res = $browser->request($req);
	
	if ($res->is_success) {
		return $res->header('Resource-Content-Length');
	}
	else {
		die "HTTP ERROR: " . $res->status_line();
	}
}

sub getChunkFile {
	my $range = shift;
	my $reqURL = new URI::URL($opt{fileURL});
	my $postBody = '{ "method": "GET" , "hostname": "'.$reqURL->host().'", "path": "'.$reqURL->path().'" }';
	
	my $req = HTTP::Request->new(POST => "http://127.0.0.1:1337/");
	$req->header(Range => "bytes=$range" );
	$req->header("Cache-Control" => "no-store");
	$req->content( $postBody );
	my $res = $browser->request($req);
 
	my $CHUNK_FILE = "chunk".$range;
	my $DECIPHER_CMD = "./decipher.js  chunk".$range;
	open(my $decipher,"|-",$DECIPHER_CMD);

	if ($res->is_success) {
		print $decipher $res->content;
	}
	else {
		die "HTTP ERROR: ",$res->status_line, "\n";
	}
	close($decipher);

	my $file = $opt{ofs};
	open(CHUNK_FILE,$CHUNK_FILE);
	binmode(CHUNK_FILE);
	print $file <CHUNK_FILE>;
	close(CHUNK_FILE);
	
	unlink $CHUNK_FILE;
}

sub getFile {
 	my $chunkNum = int($opt{fsize} / $opt{csize});
 	my $chunkRes = $opt{fsize} % $opt{csize};
 	my $chunkStart = 0;
 	my $chunkStop = 0;
	my $i = 0;

	my $vchunkNum = $chunkNum; # $vchunkNum serve solo per la visualizzazione del msg.
	$vchunkNum = $chunkNum + 1 if ( $chunkRes );
	
 	for( $i = 0; $i != $chunkNum ; $i++ ) {
		print "chunk ",$i + 1,"/$vchunkNum\n";

		$chunkStop = (($opt{csize}*($i+1))-1);
 		getChunkFile( "$chunkStart-$chunkStop" );
 		$chunkStart = $chunkStop + 1;
 	}
 	
 	if ( $chunkRes ) {
		print "chunk ",$i + 1,"/$vchunkNum\n";

 		getChunkFile("$chunkStart-$opt{fsize}");
 	}
}

sub showMsg {
	print "Downloading ...\n";
	print "\nfileURL   : ",$opt{fileURL},"\n";
	print "out file  : ",$opt{out},"\n";
	print "chunk size: ",$opt{csize},"\n";
	print "file size : ",$opt{fsize},"\n";
}

##### Main ###########

checkOpt();
$opt{fsize} = getFileSize();
showMsg();

openLFile();
getFile();
closeLFile();

 __END__

=head1 NAME

fuckTheProxy

=head1 SYNOPSIS

fuckTheProxy [ option ] file URL

Options:
-help            sintassi
-man             man page
-csize [ size in M ]
-out  [ file name ].

=head1 OPTIONS

=over 8

=item B<-help>

Sintassi del comando.

=item B<-man>

Stampa il manuale del prodotto.

=item B<-csize>

Chunk size espressa in Mega default 5M.

=item B<-out>

Specifica il nome del file da assegnare al file locale. Di default viene

=back

=head1 DESCRIPTION

B<fuckTheProxy> Utility per eseguire i download superando i limiti imposti dal proxy su: grandezza dei file in download e numero di
file contenuti in un archivio.

=cut